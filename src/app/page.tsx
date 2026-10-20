"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PollCard } from "@/components/PollCard";
import type { Poll } from "@/types";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function FeedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [pollErrors, setPollErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!ignore) {
        setCurrentUserId(user?.id || null);
      }

      const { data, error: fetchError } = await supabase
        .from("polls")
        .select("id, question, created_at, user_id, profiles(username), options(id, text, image_url, position)")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (ignore) return;

      if (fetchError) {
        setError("Anketler yüklenirken bir hata oluştu.");
        setLoading(false);
        return;
      }

      const fetchedPolls = (data as unknown as Poll[]) || [];
      const pollIds = fetchedPolls.map((p) => p.id);

      if (pollIds.length > 0) {
        const { data: counts } = await supabase
          .from("option_vote_counts")
          .select("option_id, vote_count")
          .in("poll_id", pollIds);

        const countsMap: Record<string, number> = {};
        counts?.forEach((c) => {
          countsMap[c.option_id] = c.vote_count;
        });

        const myVotesMap: Record<string, string> = {};
        if (user) {
          const { data: myVotes } = await supabase
            .from("votes")
            .select("poll_id, option_id")
            .in("poll_id", pollIds);

          myVotes?.forEach((v) => {
            myVotesMap[v.poll_id] = v.option_id;
          });
        }

        if (!ignore) {
          setVoteCounts(countsMap);
          setUserVotes(myVotesMap);
        }
      }

      if (!ignore) {
        setPolls(fetchedPolls);
        setHasMore(fetchedPolls.length === PAGE_SIZE);
        setError(null);
        setLoading(false);
      }
    }

    loadInitial();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [supabase, retryCount]);

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const from = polls.length;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: fetchError } = await supabase
      .from("polls")
      .select("id, question, created_at, user_id, profiles(username), options(id, text, image_url, position)")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (fetchError) {
      setError("Daha fazla anket yüklenemedi.");
      setLoadingMore(false);
      return;
    }

    const fetchedPolls = (data as unknown as Poll[]) || [];
    const pollIds = fetchedPolls.map((p) => p.id);

    if (pollIds.length > 0) {
      const { data: counts } = await supabase
        .from("option_vote_counts")
        .select("option_id, vote_count")
        .in("poll_id", pollIds);

      setVoteCounts((prev) => {
        const next = { ...prev };
        counts?.forEach((c) => {
          next[c.option_id] = c.vote_count;
        });
        return next;
      });

      if (user) {
        const { data: myVotes } = await supabase
          .from("votes")
          .select("poll_id, option_id")
          .in("poll_id", pollIds);

        setUserVotes((prev) => {
          const next = { ...prev };
          myVotes?.forEach((v) => {
            next[v.poll_id] = v.option_id;
          });
          return next;
        });
      }
    }

    setPolls((prev) => [...prev, ...fetchedPolls]);
    setHasMore(fetchedPolls.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  async function handleVote(pollId: string, optionId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setVotingPollId(pollId);
    setPollErrors((prev) => {
      const copy = { ...prev };
      delete copy[pollId];
      return copy;
    });

    const { error: voteErr } = await supabase.from("votes").insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    });

    setVotingPollId(null);

    if (voteErr) {
      if (voteErr.code === "23505" || voteErr.message.includes("unique")) {
        setPollErrors((prev) => ({
          ...prev,
          [pollId]: "Bu ankete zaten oy verdin.",
        }));

        const { data: existingVote } = await supabase
          .from("votes")
          .select("option_id")
          .eq("poll_id", pollId)
          .maybeSingle();

        if (existingVote) {
          setUserVotes((prev) => ({ ...prev, [pollId]: existingVote.option_id }));
        }
      } else {
        setPollErrors((prev) => ({
          ...prev,
          [pollId]: voteErr.message || "Oy verilirken hata oluştu.",
        }));
      }
      return;
    }

    setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
    setVoteCounts((prev) => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
    }));
  }

  async function handleDeletePoll(pollId: string) {
    const { error: delError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (delError) {
      setPollErrors((prev) => ({
        ...prev,
        [pollId]: delError.message || "Anket silinemedi.",
      }));
      return;
    }

    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  }

  return (
    <div className="space-y-8">
      {/* Gündem */}
      <section>
        <div className="grid gap-8 sm:grid-cols-[1.35fr_1fr] sm:items-start">
          <div>
            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/65">
              <span className="h-px w-8 bg-ink" />
              Gündem — 01
            </div>

            <h1 className="mt-4 font-serif text-[44px] leading-[0.94] tracking-[-0.02em] text-ink sm:text-[58px]">
              Kararsız mısın?
              <br />
              Sor. Oylat.
              <br />
              <span className="italic text-alert">Karar ver.</span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink/65">
              İki seçenek arasında mı kaldın? Sorunu yaz, seçenekleri koy;
              kararı topluluk versin.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/create"
                className="group inline-flex items-center gap-3 bg-ink px-5 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Anket aç
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#feed"
                className="inline-flex items-center gap-2 border-b border-ink pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-signal hover:text-alert focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                Akışa in
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>

            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
              Ücretsiz · 30 saniyede anket
            </p>
          </div>

          {/* Karar şeması */}
          <div className="hidden sm:block">
            <div className="relative border border-ink">
              <div className="grid grid-cols-2">
                <div className="flex aspect-square flex-col justify-between border-r border-ink bg-ink p-4 text-paper">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/55">
                    01 / Bu
                  </span>
                  <span className="font-serif text-[42px] leading-none">This</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-paper/55">
                    Seçenek A
                  </span>
                </div>
                <div className="flex aspect-square flex-col justify-between bg-white p-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
                    02 / Şu
                  </span>
                  <span className="pl-7 font-serif text-[42px] leading-none">That</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink/65">
                    Seçenek B
                  </span>
                </div>
              </div>
              <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-ink bg-signal font-serif text-xl italic text-ink">
                /
              </span>
            </div>
            <p className="mt-2 text-right font-mono text-[8px] uppercase tracking-[0.16em] text-ink/65">
              Şekil 01 — Karar şeması
            </p>
          </div>
        </div>

        <div className="mt-7 border-y border-line font-mono text-[9px] uppercase tracking-[0.1em] text-ink/65 sm:grid sm:grid-cols-3 sm:gap-2 sm:py-3 sm:text-[10px]">
          <span className="flex items-center justify-between border-b border-line py-2.5 sm:block sm:border-0 sm:py-0">
            <span>01</span>
            <span>
              <span className="mx-1 hidden sm:inline">—</span>Tek oy hakkı
            </span>
          </span>
          <span className="flex items-center justify-between border-b border-line py-2.5 sm:block sm:border-0 sm:py-0 sm:text-center">
            <span>02</span>
            <span>
              <span className="mx-1 hidden sm:inline">—</span>Anında sonuç
            </span>
          </span>
          <span className="flex items-center justify-between py-2.5 sm:block sm:py-0 sm:text-right">
            <span>03</span>
            <span>
              <span className="mx-1 hidden sm:inline">—</span>2–5 seçenek
            </span>
          </span>
        </div>
      </section>

      {/* Misafir bilgilendirmesi */}
      {!loading && !currentUserId && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-ink bg-smoke px-4 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink/65 sm:text-[10px]">
            Misafir görünümü
            <span
              aria-hidden
              className="mx-2 inline-block h-3 w-px bg-ink/40 align-middle"
            />
            Oy vermek için giriş yap
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-ink px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-signal hover:text-ink"
          >
            Giriş yap
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Akış başlığı */}
      <div id="feed" className="scroll-mt-24 border-b border-ink pb-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/65">
              02 — Akış
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-none tracking-[-0.01em] text-ink sm:text-4xl">
              En yeni anketler
            </h2>
          </div>
          {!loading && polls.length > 0 && (
            <span className="mb-0.5 shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/65">
              {String(polls.length).padStart(2, "0")} anket
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-line border-l-2 border-l-alert bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-signal text-ink">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
                Hata
              </p>
              <p className="mt-1 text-sm text-ink">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setRetryCount((prev) => prev + 1);
                }}
                className="mt-4 bg-ink px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-signal hover:text-ink"
              >
                Tekrar dene
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div>
          <p role="status" className="sr-only">
            Anketler yükleniyor...
          </p>
          <div className="space-y-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-line bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 animate-pulse bg-line/70" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-24 animate-pulse bg-line/70" />
                    <div className="h-2 w-16 animate-pulse bg-line/50" />
                  </div>
                </div>
                <div className="mt-5 h-6 w-3/4 animate-pulse bg-line/70" />
                <div className="mt-5 space-y-2">
                  <div className="h-11 border border-line bg-smoke/40" />
                  <div className="h-11 border border-line bg-smoke/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && polls.length === 0 && (
        <div className="border border-ink bg-white p-7 sm:p-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/65">
            Kayıt yok
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-none tracking-tight text-ink sm:text-4xl">
            Henüz anket yok.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">
            İlk kararsız kalan sen ol. Sorunu yaz, seçenekleri koy; topluluk
            karar versin.
          </p>
          <Link
            href="/create"
            className="group mt-6 inline-flex items-center gap-3 bg-ink px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-signal hover:text-ink"
          >
            İlk anketi oluştur
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

      {!loading && !error && polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={currentUserId}
              userVotedOptionId={userVotes[poll.id] || null}
              voteCounts={voteCounts}
              onVote={handleVote}
              onDelete={handleDeletePoll}
              isVoting={votingPollId === poll.id}
              voteError={pollErrors[poll.id] || null}
            />
          ))}

          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="group flex w-full items-center justify-center gap-2 border border-ink py-3.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Yükleniyor</span>
                </>
              ) : (
                <>
                  <span>Daha fazla yükle</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink/65">
                Akışın sonu
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
