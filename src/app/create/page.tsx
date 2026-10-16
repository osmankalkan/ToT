import type { Metadata } from "next";
import { PollForm } from "@/components/PollForm";

export const metadata: Metadata = {
  title: "Yeni Anket Oluştur | ThisOrThat",
  description: "Kararsız kaldığın konuda bir soru ve seçenekler paylaş, oy topla.",
};

export default function CreatePollPage() {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-5 sm:p-7 shadow-sm">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Yeni Anket Aç</h1>
        <p className="mt-1 text-xs text-gray-500">
          İki ile beş arasında seçenek belirle, topluluğun oy vermesini sağla.
        </p>
      </div>

      <PollForm />
    </div>
  );
}
