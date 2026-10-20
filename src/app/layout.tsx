import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "ThisOrThat — Kararsız mı kaldın?",
    template: "%s | ThisOrThat",
  },
  description:
    "Kararsız kaldığın soruları paylaş, topluluğun oyunu topla. Hızlı, sade ve eğlenceli anket deneyimi.",
  applicationName: "ThisOrThat",
  keywords: ["anket", "oy", "this or that", "karar", "sosyal anket"],
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink">
        {/* Baskı şeridi */}
        <div className="bg-ink text-paper">
          <div className="mx-auto flex h-8 max-w-3xl items-center justify-between px-5 font-mono text-[9px] uppercase tracking-[0.18em] sm:px-8">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-signal" />
              Kararsız mısın?
            </span>
            <span className="hidden text-paper/60 sm:inline">
              Sor · Oylat · Karar ver
            </span>
            <span className="text-paper/60">Topluluk anketleri</span>
          </div>
        </div>

        <Navbar />

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
          {children}
        </main>

        <footer className="border-t border-ink">
          <div className="mx-auto flex max-w-3xl flex-col gap-1.5 px-5 py-6 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>ThisOrThat — Kararsız kalma, oylat.</span>
            <span>Topluluk karar panosu / 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
