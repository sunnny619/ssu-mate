"""회의록 파서 — meeting_minutes 테이블 스키마에 대응

활동보고서와 구조가 다르다.
  - 헤더(일시/장소/작성자)는 가로형 표 1행에 나란히 들어간다
  - 회의 안건 본문은 표 밖 텍스트이며 여러 페이지에 걸친다
  - 파일 1개 = 회의 1건 (활동보고서는 페이지당 1건)
"""
import re
import pdfplumber

from .base import parse_date, clean_text, norm_label

DOC_TYPE = "meeting_minutes"

SECTION_HEAD = re.compile(r"^\s*\d+\.\s*(보고안건|단위보고|논의안건|기타안건|일정\s*공유)")
# 세로 병합된 라벨이 본문 줄에 끼어드는 경우 제거
INLINE_LABEL = re.compile(r"회의\s*안건\s*")
SCHEDULE_HEAD = re.compile(r"일정\s*공유")

HEADER_LABELS = {"회의일시", "장소", "작성자", "성원확인", "회의안건"}


def parse_header(page) -> dict:
    """헤더는 표 셀이 일부 누락되므로 텍스트에서 정규식으로 뽑는다.
    참석자 명단만 표에서 가져온다."""
    head = {"date_raw": None, "location": None, "author": None, "attendees": []}
    text = (page.extract_text() or "").replace("\u00a0", " ")

    m = re.search(r"회의\s*일시\s*(.+?)\s*장\s*소", text)
    if m:
        head["date_raw"] = m.group(1).strip()

    m = re.search(r"장\s*소\s*(.+?)\s*작성자", text)
    if m:
        head["location"] = m.group(1).strip()

    m = re.search(r"작성자\s*([가-힣]{2,4})", text)
    if m:
        head["author"] = m.group(1).strip()

    # 참석자: 성원확인 행의 한글 이름들.
    # 작성자도 성원확인 행에 함께 적히므로 참석자에서 빼지 않는다.
    tables = page.extract_tables()
    if tables:
        seen = set()
        for row in tables[0][1:]:               # 첫 행은 일시·장소·작성자 행
            for c in row or []:
                v = (c or "").strip()
                if not v or v in seen:          # 병합 셀로 같은 이름이 두 번 잡히기도 한다
                    continue
                if norm_label(v) in HEADER_LABELS:   # '성원확인' 같은 라벨 혼입 제거
                    continue
                if re.fullmatch(r"[가-힣]{2,4}", v):
                    seen.add(v)
                    head["attendees"].append(v)
    return head


def parse_body(pdf):
    """표 밖 텍스트를 모아 안건 본문과 일정 공유로 나눈다"""
    lines = []
    for page in pdf.pages:
        for ln in (page.extract_text() or "").split("\n"):
            ln = INLINE_LABEL.sub("", ln).strip()
            if not ln or ln.isdigit():          # 쪽번호 제거
                continue
            lines.append(ln)

    start = 0
    for i, ln in enumerate(lines):
        if SECTION_HEAD.match(ln):
            start = i
            break

    agenda, schedule, in_schedule = [], [], False
    for ln in lines[start:]:
        if SCHEDULE_HEAD.search(ln) and len(ln) < 20:
            in_schedule = True
            rest = SCHEDULE_HEAD.sub("", ln).strip()
            if rest:
                schedule.append(rest)
            continue
        (schedule if in_schedule else agenda).append(ln)

    return "\n".join(agenda).strip(), "\n".join(schedule).strip()


def extract(pdf_path: str) -> dict:
    records, failures = [], []

    with pdfplumber.open(pdf_path) as pdf:
        if not pdf.pages:
            return {"doc_type": DOC_TYPE, "records": [],
                    "failures": [{"page_no": None, "reason": "빈 PDF"}]}

        head = parse_header(pdf.pages[0])
        agenda, schedule = parse_body(pdf)
        start, _end, ym = parse_date(head.get("date_raw"))

        first = pdf.pages[0].extract_text() or ""
        m = re.search(r"제\s*(\d+)\s*차", first)

        rec = {
            # --- meeting_minutes 컬럼 ---
            "page_no": 1,                       # 파일 1개 = 회의 1건
            "meeting_date": start,
            "meeting_ym": ym,
            "location": clean_text(head.get("location")),
            "author": head.get("author"),       # 개인정보: 답변 노출 금지
            "agenda_body": clean_text(agenda),
            "schedule_body": clean_text(schedule),

            # --- 컬럼 아님. 적재 시 검증·참고용 ---
            "_meta": {
                "date_raw": head.get("date_raw"),
                "session_no": int(m.group(1)) if m else None,
                "attendee_count": len(head["attendees"]),
                "page_count": len(pdf.pages),
            },
        }

    if not rec["agenda_body"]:
        failures.append({"page_no": 1, "reason": "회의 안건 본문을 찾지 못함"})
    elif not rec["meeting_date"]:
        failures.append({"page_no": 1, "reason": "회의 일시를 찾지 못함"})
    else:
        records.append(rec)

    return {"doc_type": DOC_TYPE, "records": records, "failures": failures}