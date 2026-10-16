"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PollCard } from "@/components/PollCard";
import type { Poll } from "@/types";
import { Loader2, AlertCircle, PlusCircle, Sparkles } from "lucide-react";

const PAGE_SIZE = 10;

export default function FeedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [polls, setPolls] = useState<Poll[]>([]);
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
    return () => {
      ignore = true;
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

        // Kullanıcının daha önce verdiği oyu alıp sonuçları göster
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

    // Başarılı oy: anında barları güncelle ve animasyonu başlat
    setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
    setVoteCounts((prev) => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">En Yeni Anketler</h1>
          <p className="text-xs text-gray-500">Topluluğun kararsız kaldığı sorulara oy ver</p>
        </div>
        <Link href="/create" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Fikir Sor</span>
        </Link>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
          <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRetryCount((prev) => prev + 1);
            }}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm font-medium">Anketler yükleniyor...</p>
        </div>
      )}

      {!loading && !error && polls.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">Henüz anket yok</h2>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            İlk kararsız kalan sen ol! Hemen yeni bir anket açıp topluluğun fikrini al.
          </p>
          <Link
            href="/create"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            İlk Anketi Oluştur
          </Link>
        </div>
      )}

      {!loading && !error && polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              userVotedOptionId={userVotes[poll.id] || null}
              voteCounts={voteCounts}
              onVote={handleVote}
              isVoting={votingPollId === poll.id}
              voteError={pollErrors[poll.id] || null}
            />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <span>Daha Fazla Yükle</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
