import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "InstaAutoDM",
  description: "Auto-DM promised links to Instagram commenters",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={font.className}>
      <body>{children}</body>
    </html>
  );
}
