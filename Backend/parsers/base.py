"""문서 종류와 무관하게 공통으로 쓰는 표 추출·정규화 유틸"""
import re
import pdfplumber

# 값이 비어있는 것으로 취급할 표기
EMPTY = {"", "-", "–", "—", "없음", "N/A", "해당없음"}


def norm_label(s: str) -> str:
    """'활 동 장 소' -> '활동장소' (양식마다 자간이 다름)"""
    return re.sub(r"\s+", "", s or "")


def read_table(page, labels: dict) -> dict:
    """표 1개를 {필드키: 원문} 으로 바꾼다.

    labels : {'활동장소': 'location', ...} 형태의 라벨 매핑.
             매핑에 없는 라벨(푸터 혼입 등)은 버린다.
    첫 칸이 빈 병합 셀이면 직전 항목의 이어지는 줄로 붙인다.
    """
    tables = page.extract_tables()
    if not tables:
        return {}

    fields, last_key = {}, None
    for row in tables[0]:
        if not row:
            continue
        label = norm_label(row[0])
        value = (row[1] if len(row) > 1 else None) or ""

        if label in labels:
            last_key = labels[label]
            if last_key:
                fields[last_key] = value
        elif label == "" and last_key and value:
            fields[last_key] = (fields.get(last_key, "") + "\n" + value).strip()
        # 매핑에 없는 라벨은 무시

    return fields


def parse_date(raw: str):
    """'2026년 5월 6일'            -> ('2026-05-06', '2026-05-06', '202605')
       '2026년 5월 18일 ~ 5월 30일' -> ('2026-05-18', '2026-05-30', '202605')
       '2026년 5월'                -> (None, None, '202605')
    """
    if not raw:
        return None, None, None

    y = re.search(r"(\d{4})\s*년", raw)
    if not y:
        return None, None, None
    year = int(y.group(1))

    pairs = re.findall(r"(\d{1,2})\s*월\s*(\d{1,2})\s*일", raw)
    if not pairs:
        m = re.search(r"(\d{1,2})\s*월", raw)
        return None, None, (f"{year}{int(m.group(1)):02d}" if m else None)

    m1, d1 = pairs[0]
    start = f"{year}-{int(m1):02d}-{int(d1):02d}"
    end = start
    if len(pairs) > 1:
        m2, d2 = pairs[1]
        end = f"{year}-{int(m2):02d}-{int(d2):02d}"
    return start, end, f"{year}{int(m1):02d}"


def parse_participants(raw: str):
    """'38명' -> 38 | '-' -> None | '10여 명' -> None (원문은 별도 보존)"""
    if not raw or raw.strip() in EMPTY:
        return None
    if re.search(r"(여|약|이상|미만|내외|전원|명단)", raw):
        return None
    m = re.search(r"(\d+)\s*명?", raw.replace(",", ""))
    return int(m.group(1)) if m else None


def clean_text(raw: str):
    """줄바꿈으로 잘린 URL을 이어붙이고, 빈 표기는 None 으로"""
    if not raw:
        return None
    lines = raw.split("\n")
    out = []
    for ln in lines:
        if out and re.search(r"https?://\S*$", out[-1]) and not ln.startswith(("http", "(", "[")):
            out[-1] += ln.strip()
        else:
            out.append(ln)
    text = "\n".join(out).strip()
    return None if text in EMPTY else text


def parse_club_name(raw: str):
    """'동아리 명 : 멋쟁이사자처럼\\n대표자 : 최원재' -> '멋쟁이사자처럼'
    대표자 이름은 개인정보이므로 반환하지 않는다."""
    if not raw:
        return None
    m = re.search(r"동아리\s*명\s*[:：]\s*(.+)", raw)
    return m.group(1).strip() if m else None


def iter_pages(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            yield i, page