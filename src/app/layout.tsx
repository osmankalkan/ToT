import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "ThisOrThat",
  description: "Kararsız mı kaldın? Sor, oylansın.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <Navbar />
        <main className="mx-auto w-full max-w-xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
