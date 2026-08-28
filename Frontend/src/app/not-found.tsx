import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청한 경로가 존재하지 않습니다.</p>
      <Link href="/">슈메이트로 돌아가기</Link>
    </main>
  );
}
