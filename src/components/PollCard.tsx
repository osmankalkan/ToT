import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import type { Poll } from "@/types";
import { User, Clock } from "lucide-react";

interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
  userVotedOptionId?: string | null;
  voteCounts?: Record<string, number>;
  totalVotes?: number;
  isVoting?: boolean;
}

export function PollCard({
  poll,
  onVote,
  userVotedOptionId,
  isVoting = false,
}: PollCardProps) {
  const authorName = Array.isArray(poll.profiles)
    ? poll.profiles[0]?.username
    : poll.profiles?.username || "anonim";

  const sortedOptions = [...poll.options].sort((a, b) => a.position - b.position);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Üst bilgi: Kullanıcı adı ve ne kadar önce açıldığı */}
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

      {/* Seçenekler Listesi (Faz 4: Oy öncesi görünüm) */}
      <div className="space-y-2.5">
        {sortedOptions.map((option) => {
          const isSelected = userVotedOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={isVoting || !!userVotedOptionId || !onVote}
              onClick={() => onVote?.(option.id)}
              className={`group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50"
                  : "border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/20 active:scale-[0.99]"
              } disabled:cursor-default disabled:hover:border-gray-200 disabled:hover:bg-gray-50/50`}
            >
              {/* Varsa Seçenek Görseli */}
              {option.image_url && (
                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={option.image_url}
                    alt={option.text}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Seçenek Metni */}
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
    </article>
  );
}
