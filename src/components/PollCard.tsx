"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { Poll } from "@/types";
import { AlertCircle, Loader2 } from "lucide-react";
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
    <article className="border border-line bg-white transition-colors hover:border-ink">
      <div className="p-5 sm:p-6">
        {/* Üst bilgi */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink font-serif text-lg italic leading-none text-paper"
            >
              {authorName.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink">
                  @{authorName}
                </span>
                {isOwner && (
                  <span className="border border-ink bg-signal px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-ink">
                    Senin
                  </span>
                )}
              </div>
              <time
                dateTime={poll.created_at}
                className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink/65"
              >
                {formatRelativeTime(poll.created_at)}
              </time>
            </div>
          </div>

          {isOwner && onDelete && (
            <PollDeleteButton pollId={poll.id} onDelete={onDelete} />
          )}
        </div>

        {/* Soru */}
        <h3 className="mt-5 font-serif text-[25px] leading-[1.08] tracking-[-0.01em] text-ink text-balance sm:text-[28px]">
          {poll.question}
        </h3>

        {/* Hata bildirimi */}
        {voteError && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 border-l-2 border-l-alert bg-smoke px-3 py-2 text-xs text-ink"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-alert" />
            <span>{voteError}</span>
          </div>
        )}

        {/* Seçenekler */}
        <div className="mt-5 space-y-2">
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
      </div>

      {/* Alt bilgi */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/65 sm:px-6">
        {hasVoted ? (
          <span>
            {String(totalVotes).padStart(2, "0")} oy
            <span
              aria-hidden
              className="mx-2 inline-block h-3 w-px bg-ink/30 align-middle"
            />
            Sonuçlar
          </span>
        ) : (
          <span>Sonuçlar gizli — oyla</span>
        )}

        {isVoting && (
          <span className="flex items-center gap-1.5 text-alert">
            <Loader2 className="h-3 w-3 animate-spin" />
            Kaydediliyor
          </span>
        )}
      </div>
    </article>
  );
}
