import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jackbox",
  description: "Prospect demo generator for founder-led sales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
