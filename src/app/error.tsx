"use client";

import Link from "next/link";
import { AlertOctagon } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertOctagon className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Beklenmeyen Bir Hata Oluştu</h1>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        {error.message || "Sayfa yüklenirken bir problem yaşandı. Lütfen tekrar deneyin."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Tekrar Dene
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
        >
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
