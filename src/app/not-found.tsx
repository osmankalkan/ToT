import Link from "next/link";
import { ArrowUpRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="border border-ink bg-white">
        <div className="flex items-center justify-between border-b border-ink px-5 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/65">
            Kayıt bulunamadı
          </p>
          <span className="h-2 w-2 bg-signal" />
        </div>

        <div className="p-6 sm:p-10">
          <p className="font-serif text-[92px] leading-none tracking-[-0.05em] text-ink sm:text-[112px]">
            404<span className="text-signal">.</span>
          </p>

          <h1 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.01em] text-ink">
            Sayfa bulunamadı.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">
            Aradığın anket veya sayfa silinmiş ya da hiç var olmamış olabilir.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-ink px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Home className="h-3.5 w-3.5" />
              Ana sayfa
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 border border-ink px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-smoke focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Anket aç
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
