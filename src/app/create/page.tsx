import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PollForm } from "@/components/PollForm";

export const metadata: Metadata = {
  title: "Yeni Anket Oluştur",
  description: "Kararsız kaldığın konuda bir soru ve seçenekler paylaş, oy topla.",
};

export default function CreatePollPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/70 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Akışa dön
      </Link>

      <div className="mt-4 border border-ink bg-white">
        <header className="relative flex items-start justify-between gap-4 border-b border-ink p-5 sm:p-7">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/65">
              Yeni — Form 01
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-none tracking-[-0.02em] text-ink sm:text-5xl">
              Yeni anket aç.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">
              Sorunu net tut, 2–5 seçenek ekle ve topluluğun karar vermesine
              yardım et.
            </p>
          </div>
          <span
            aria-hidden
            className="hidden h-12 w-12 shrink-0 items-center justify-center bg-signal font-serif text-3xl italic leading-none text-ink sm:flex"
          >
            +
          </span>
        </header>

        <div className="border-b border-line bg-smoke px-5 py-3 sm:px-7">
          <p className="flex items-start gap-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-ink/65">
            <span className="shrink-0 bg-ink px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.1em] text-paper">
              Not
            </span>
            Kısa ve net sorular en çok oy alır. Örn. &quot;Sinema mı, restoran
            mı?&quot;
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <PollForm />
        </div>
      </div>
    </div>
  );
}
