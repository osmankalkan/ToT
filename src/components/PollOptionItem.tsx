"use client";

import Image from "next/image";
import type { Option } from "@/types";
import { ArrowRight, Check } from "lucide-react";

interface PollOptionItemProps {
  option: Option;
  hasVoted: boolean;
  isSelected: boolean;
  count: number;
  percentage: number;
  isVoting: boolean;
  onVote: () => void;
}

export function PollOptionItem({
  option,
  hasVoted,
  isSelected,
  count,
  percentage,
  isVoting,
  onVote,
}: PollOptionItemProps) {
  const letter = String.fromCharCode(64 + option.position);

  if (hasVoted) {
    return (
      <div
        className={`relative isolate overflow-hidden border transition-colors ${
          isSelected ? "border-ink bg-white" : "border-line bg-white"
        }`}
      >
        {option.image_url && (
          <div className="relative h-40 w-full overflow-hidden border-b border-line bg-smoke">
            <Image
              src={option.image_url}
              alt={option.text}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Yüzde barı */}
        <div
          aria-hidden
          className={`absolute inset-y-0 left-0 -z-10 transition-all duration-700 ease-out ${
            isSelected ? "bg-signal/15" : "bg-smoke/60"
          }`}
          style={{ width: `${percentage}%` }}
        />

        <div className="flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[10px] font-semibold ${
                isSelected
                  ? "border-ink bg-signal text-ink"
                  : "border-ink/20 text-ink/65"
              }`}
            >
              {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : letter}
            </span>
            <span
              className={`truncate text-sm ${
                isSelected ? "font-semibold text-ink" : "text-ink/65"
              }`}
            >
              {option.text}
            </span>
            {isSelected && (
              <span className="hidden shrink-0 border border-ink px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink sm:inline">
                Oyun
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-baseline gap-2.5">
            <span className="font-mono text-[9px] tracking-[0.04em] text-ink/65">
              {count} oy
            </span>
            <span
              className={`font-mono text-base font-bold tabular-nums ${
                isSelected ? "text-alert" : "text-ink/70"
              }`}
            >
              %{percentage}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isVoting}
      onClick={onVote}
      aria-label={`${option.text} seçeneğine oy ver`}
      className="group flex w-full flex-col overflow-hidden border border-line bg-white text-left transition-colors hover:border-ink hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:bg-ink disabled:pointer-events-none disabled:opacity-50"
    >
      {option.image_url && (
        <div className="relative h-40 w-full overflow-hidden border-b border-line bg-smoke">
          <Image
            src={option.image_url}
            alt={option.text}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-ink/25 font-mono text-[10px] font-semibold text-ink/70 transition-colors group-hover:border-paper/40 group-hover:text-paper">
            {letter}
          </span>
          <span className="truncate text-sm font-medium text-ink transition-colors group-hover:text-paper">
            {option.text}
          </span>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink/65 transition-colors group-hover:text-paper/70">
          <span className="hidden sm:inline">Oyla</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
