import Link from "next/link";
import { HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <HelpCircle className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Sayfa Bulunamadı</h1>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Aradığın anket veya sayfa silinmiş veya hiç var olmamış olabilir.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
