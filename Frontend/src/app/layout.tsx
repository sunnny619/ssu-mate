import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "슈메이트 | 창업지원단 동아리 협업 에이전트",
  description: "숭실대학교 창업지원단을 위한 동아리 협업 에이전트 프로토타입",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
