import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShiftNZ Wholesale - Grid Load Manager",
  description: "Real-time NZ wholesale price visibility for large grid customers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-50 text-slate-900">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
