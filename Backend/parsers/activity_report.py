"""활동보고서 파서 — activity_report 테이블 스키마에 대응

PDF 1개 = 활동 여러 건 (페이지마다 1건)
"""
from .base import (
    read_table, parse_date, parse_participants,
    clean_text, parse_club_name, iter_pages, EMPTY,
)

DOC_TYPE = "activity_report"

# 표 라벨 -> 내부 키. 값이 None 이면 읽되 버린다.
LABELS = {
    "일시": "_date",
    "소속": "_affiliation",
    "활동장소": "location",
    "참여인원": "_participant",
    "활동내용": "activity_body",
    "자료첨부": None,          # 이미지뿐
}


def parse_page(page, page_no: int):
    f = read_table(page, LABELS)

    # 일시가 없으면 활동보고서 페이지가 아니다
    if "_date" not in f:
        return None

    start, end, ym = parse_date(f.get("_date"))
    participant_raw = (f.get("_participant") or "").strip() or None

    return {
        # --- activity_report 컬럼 ---
        "page_no": page_no,
        "activity_date": start,
        "activity_end_date": end,
        "activity_ym": ym,
        "location": clean_text(f.get("location")),
        "participant_count": parse_participants(f.get("_participant")),
        "participant_raw": participant_raw,
        "activity_body": clean_text(f.get("activity_body")),

        # --- 컬럼은 아니지만 적재 시 검증에 쓰는 값 ---
        "_meta": {
            "date_raw": (f.get("_date") or "").strip() or None,
            "club_name_raw": parse_club_name(f.get("_affiliation")),
        },
    }


def extract(pdf_path: str) -> dict:
    """반환 형식은 회의록 파서와 동일하다.
    { doc_type, records[], failures[] }
    """
    records, failures = [], []

    for page_no, page in iter_pages(pdf_path):
        try:
            r = parse_page(page, page_no)
        except Exception as e:
            failures.append({"page_no": page_no, "reason": f"{type(e).__name__}: {e}"})
            continue

        if r is None:
            failures.append({"page_no": page_no, "reason": "일시 항목을 찾지 못함"})
        elif not r["activity_body"]:
            failures.append({"page_no": page_no, "reason": "활동 내용이 비어 있음"})
        else:
            records.append(r)

    return {"doc_type": DOC_TYPE, "records": records, "failures": failures}