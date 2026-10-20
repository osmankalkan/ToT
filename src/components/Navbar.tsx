"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Plus } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Öncelik: profil tablosu, yoksa user_metadata
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        setUsername(profile?.username || user.user_metadata?.username || null);
      } else {
        setUsername(null);
      }
      setLoading(false);
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", session.user.id)
            .maybeSingle();

          setUsername(profile?.username || session.user.user_metadata?.username || null);
        } else {
          setUsername(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink bg-paper">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-baseline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          aria-label="ThisOrThat ana sayfa"
        >
          <span className="font-serif text-[27px] leading-none tracking-[-0.02em] text-ink">
            this
            <span className="mx-0.5 italic text-signal transition-colors group-hover:text-ink">/</span>
            or
            <span className="mx-0.5 italic text-signal transition-colors group-hover:text-ink">/</span>
            that
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <span
              aria-label="Yükleniyor"
              className="block h-8 w-8 animate-pulse border border-line bg-smoke"
            />
          ) : username ? (
            <>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-ink/65 sm:inline">
                @{username}
              </span>

              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-ink px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Anket Aç</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
                className="flex h-9 w-9 items-center justify-center border border-transparent text-ink/65 transition-colors hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center px-1 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="bg-ink px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
