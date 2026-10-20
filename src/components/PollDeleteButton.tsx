"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface PollDeleteButtonProps {
  pollId: string;
  onDelete: (pollId: string) => Promise<void> | void;
}

export function PollDeleteButton({ pollId, onDelete }: PollDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(pollId);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 border border-ink bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]">
        <span className="font-semibold text-ink">Silinsin mi?</span>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="px-1 py-0.5 font-bold text-alert transition-colors hover:bg-smoke disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sil"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setConfirming(false)}
          className="px-1 py-0.5 text-ink/65 transition-colors hover:bg-smoke hover:text-ink"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title="Anketi Sil"
      aria-label="Anketi sil"
      className="flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-ink/35 transition-colors hover:border-ink hover:text-alert focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
