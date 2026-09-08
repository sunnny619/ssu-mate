"""문서 종류에 맞는 파서로 넘겨주는 진입점

사용:
    from parsers import parse
    result = parse("5월_활동보고서.pdf", doc_type="activity_report")
"""
import pdfplumber

from . import activity_report, meeting_minutes

PARSERS = {
    activity_report.DOC_TYPE: activity_report,
    meeting_minutes.DOC_TYPE: meeting_minutes,
}


def detect_doc_type(pdf_path: str):
    """제목 줄로 문서 종류를 추정한다.
    업로드 시 지정된 doc_type 과 다르면 검수 대상으로 넘기기 위해 사용."""
    with pdfplumber.open(pdf_path) as pdf:
        head = (pdf.pages[0].extract_text() or "")[:200].replace(" ", "")
    if "활동보고서" in head:
        return activity_report.DOC_TYPE
    if "회의록" in head:
        return meeting_minutes.DOC_TYPE
    return None


def parse(pdf_path: str, doc_type: str = None) -> dict:
    """doc_type 을 주지 않으면 문서에서 추정한다."""
    if doc_type is None:
        doc_type = detect_doc_type(pdf_path)

    if doc_type not in PARSERS:
        return {
            "doc_type": doc_type,
            "records": [],
            "failures": [{"page_no": None, "reason": f"지원하지 않는 문서 종류: {doc_type}"}],
        }

    result = PARSERS[doc_type].extract(pdf_path)

    # 지정된 종류와 문서 내용이 다르면 표시 (잘못 분류된 업로드 감지)
    detected = detect_doc_type(pdf_path)
    if detected and detected != doc_type:
        result["type_mismatch"] = {"declared": doc_type, "detected": detected}

    return result


if __name__ == "__main__":
    import json, sys
    print(json.dumps(parse(sys.argv[1]), ensure_ascii=False, indent=2))