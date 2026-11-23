import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstaAutoDM",
  description: "Auto-DM promised links to Instagram commenters",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
