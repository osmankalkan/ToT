"use client";

import Image from "next/image";
import type { Option } from "@/types";
import { Check } from "lucide-react";

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
  if (hasVoted) {
    return (
      <div
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

        {/* Yüzde Barı (Tailwind transition-all duration-500) */}
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
            isSelected ? "bg-indigo-100/90" : "bg-gray-100/80"
          }`}
          style={{ width: `${percentage}%` }}
        />

        <div className="relative z-10 flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2 pr-2">
            {isSelected && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
            <span
              className={`text-sm ${
                isSelected ? "font-bold text-indigo-950" : "font-medium text-gray-800"
              }`}
            >
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
      type="button"
      disabled={isVoting}
      onClick={onVote}
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
}
