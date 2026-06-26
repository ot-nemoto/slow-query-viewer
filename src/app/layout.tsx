import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MySQL スロークエリ解析ツール",
  description:
    "MySQLスロークエリログをブラウザにドラッグ＆ドロップするだけで、クエリの統計・時系列・パラメータを可視化できる分析ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
