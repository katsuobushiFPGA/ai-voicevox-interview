import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ずんだもん面接 - AI採用面接シミュレーター",
  description:
    "VOICEVOXのずんだもんが面接官を務めるAIエンジニア採用面接シミュレーター",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
