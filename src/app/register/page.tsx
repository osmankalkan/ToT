import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "ThisOrThat hesabı oluştur.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="border border-ink bg-white">
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative flex flex-col justify-between overflow-hidden bg-ink p-6 text-paper sm:p-8 md:min-h-[620px]">
            <div className="flex items-center justify-between">
              <span className="font-serif text-2xl leading-none tracking-[-0.02em]">
                this<span className="mx-0.5 italic text-signal">/</span>or
                <span className="mx-0.5 italic text-signal">/</span>that
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/55">
                Kayıt / 02
              </span>
            </div>

            <p className="mt-8 max-w-[15rem] font-serif text-3xl leading-[1.05] tracking-[-0.01em] md:mt-0 md:text-4xl">
              Aramıza katıl.
              <br />
              <span className="italic text-paper/60">Fikrini sor, oyunu topla.</span>
            </p>

            <div className="mt-8 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/55">
              <span className="h-1.5 w-1.5 bg-signal" />
              E-posta gizli · kullanıcı adı görünür
            </div>
          </aside>

          <div className="p-6 sm:p-9">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/65">
              Hesap — 02
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-none tracking-[-0.02em] text-ink">
              Hesap oluştur.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">
              Kararsız kaldığın soruları sor, topluluğun oyunu topla.
            </p>

            <div className="mt-7">
              <AuthForm mode="register" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right font-mono text-[8px] uppercase tracking-[0.16em] text-ink/65">
        Ücretsiz · Kullanıcı adı toplulukta görünür.
      </p>
    </div>
  );
}
