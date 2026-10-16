"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import type { Poll } from "@/types";
import { User, Clock, Check, Loader2, AlertCircle } from "lucide-react";

interface PollCardProps {
  poll: Poll;
  userVotedOptionId?: string | null;
  voteCounts?: Record<string, number>;
  onVote: (pollId: string, optionId: string) => void;
  isVoting?: boolean;
  voteError?: string | null;
}

export function PollCard({
  poll,
  userVotedOptionId,
  voteCounts = {},
  onVote,
  isVoting = false,
  voteError,
}: PollCardProps) {
  const authorName = Array.isArray(poll.profiles)
    ? poll.profiles[0]?.username
    : poll.profiles?.username || "anonim";

  const sortedOptions = [...poll.options].sort((a, b) => a.position - b.position);
  const hasVoted = Boolean(userVotedOptionId);

  const totalVotes = sortedOptions.reduce(
    (sum, opt) => sum + (voteCounts[opt.id] || 0),
    0
  );

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Üst bilgi: Yazar ve Tarih */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <User className="h-3 w-3" />
          </div>
          <span>@{authorName}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="h-3 w-3" />
          <time dateTime={poll.created_at}>{formatRelativeTime(poll.created_at)}</time>
        </div>
      </div>

      {/* Soru */}
      <h2 className="mb-4 text-base sm:text-lg font-bold text-gray-900 leading-snug">
        {poll.question}
      </h2>

      {/* Hata Bildirimi (örn. 23505 tek oy kuralı) */}
      {voteError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{voteError}</span>
        </div>
      )}

      {/* Seçenekler Listesi */}
      <div className="space-y-2.5">
        {sortedOptions.map((option) => {
          const isSelected = userVotedOptionId === option.id;
          const count = voteCounts[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          if (hasVoted) {
            return (
              <div
                key={option.id}
                className={`relative flex flex-col overflow-hidden rounded-xl border transition ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                {option.image_url && (
                  <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={option.image_url}
                      alt={option.text}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                {/* Yüzde Barı (Tailwind transition-all duration-500 animasyonu) */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isSelected ? "bg-indigo-100/90" : "bg-gray-100/80"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-2 pr-2">
                    {isSelected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                    <span className={`text-sm ${isSelected ? "font-bold text-indigo-950" : "font-medium text-gray-800"}`}>
                      {option.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="text-gray-500">{count} oy</span>
                    <span className="font-bold text-gray-900">%{percentage}</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={isVoting}
              onClick={() => onVote(poll.id, option.id)}
              className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 text-left transition hover:border-indigo-400 hover:bg-indigo-50/20 active:scale-[0.99] disabled:opacity-50"
            >
              {option.image_url && (
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={option.image_url}
                    alt={option.text}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-3.5">
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                  {option.text}
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-400 group-hover:border-indigo-500 group-hover:text-indigo-600">
                  {String.fromCharCode(64 + option.position)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alt Bilgi */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        {hasVoted ? (
          <span>Toplam {totalVotes} oy</span>
        ) : (
          <span className="text-gray-400">Sonuçları görmek için tıkla ve oy ver</span>
        )}
        {isVoting && (
          <span className="flex items-center gap-1 text-indigo-600 font-medium">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Oy kaydediliyor...</span>
          </span>
        )}
      </div>
    </article>
  );
}
