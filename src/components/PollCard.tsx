"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { Poll } from "@/types";
import { User, Clock, Loader2, AlertCircle } from "lucide-react";
import { PollOptionItem } from "./PollOptionItem";
import { PollDeleteButton } from "./PollDeleteButton";

interface PollCardProps {
  poll: Poll;
  currentUserId?: string | null;
  userVotedOptionId?: string | null;
  voteCounts?: Record<string, number>;
  onVote: (pollId: string, optionId: string) => void;
  onDelete?: (pollId: string) => Promise<void> | void;
  isVoting?: boolean;
  voteError?: string | null;
}

export function PollCard({
  poll,
  currentUserId,
  userVotedOptionId,
  voteCounts = {},
  onVote,
  onDelete,
  isVoting = false,
  voteError,
}: PollCardProps) {
  const authorName = Array.isArray(poll.profiles)
    ? poll.profiles[0]?.username
    : poll.profiles?.username || "anonim";

  const isOwner = Boolean(currentUserId && poll.user_id === currentUserId);
  const sortedOptions = [...poll.options].sort((a, b) => a.position - b.position);
  const hasVoted = Boolean(userVotedOptionId);

  const totalVotes = sortedOptions.reduce(
    (sum, opt) => sum + (voteCounts[opt.id] || 0),
    0
  );

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Üst bilgi: Yazar, Tarih ve Varsa Sahibine Özel Silme Butonu */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <User className="h-3 w-3" />
          </div>
          <span>@{authorName}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="h-3 w-3" />
            <time dateTime={poll.created_at}>{formatRelativeTime(poll.created_at)}</time>
          </div>

          {isOwner && onDelete && (
            <PollDeleteButton pollId={poll.id} onDelete={onDelete} />
          )}
        </div>
      </div>

      {/* Soru */}
      <h2 className="mb-4 text-base sm:text-lg font-bold text-gray-900 leading-snug">
        {poll.question}
      </h2>

      {/* Hata Bildirimi */}
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

          return (
            <PollOptionItem
              key={option.id}
              option={option}
              hasVoted={hasVoted}
              isSelected={isSelected}
              count={count}
              percentage={percentage}
              isVoting={isVoting}
              onVote={() => onVote(poll.id, option.id)}
            />
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
