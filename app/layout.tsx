import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YAMANO 肌カウンセラー",
  description: "朝霧ヤマノの肌悩みカウンセラー",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
