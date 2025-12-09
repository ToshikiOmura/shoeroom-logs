import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SHOWROOM Viewer",
  description: "Realtime viewer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-white text-black">
        {children}
      </body>
    </html>
  );
}
