"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, LogOut, Loader2 } from "lucide-react";

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
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1 font-black text-xl tracking-tight text-gray-900">
          <span>This</span>
          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-white text-sm font-semibold">Or</span>
          <span>That</span>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : username ? (
            <>
              <span className="hidden sm:inline-block text-sm font-medium text-gray-600">
                @{username}
              </span>
              <Link
                href="/create"
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span>Anket Aç</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Çıkış Yap"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800"
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
