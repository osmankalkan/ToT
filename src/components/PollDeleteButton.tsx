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
      <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-xs">
        <span className="font-medium text-red-700">Silinsin mi?</span>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded px-1.5 py-0.5 font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sil"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setConfirming(false)}
          className="rounded px-1.5 py-0.5 text-gray-500 transition hover:bg-gray-200"
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
      className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
