"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PollOptionInput } from "./PollOptionInput";
import { Plus, Loader2, AlertCircle } from "lucide-react";

type OptionState = {
  id: string;
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
};

export function PollForm() {
  const router = useRouter();
  const supabase = createClient();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<OptionState[]>([
    { id: "1", text: "", imageFile: null, imagePreview: null },
    { id: "2", text: "", imageFile: null, imagePreview: null },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddOption() {
    if (options.length < 5) {
      setOptions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: "", imageFile: null, imagePreview: null },
      ]);
    }
  }

  function handleRemoveOption(index: number) {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleTextChange(index: number, text: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text };
      return next;
    });
  }

  function handleImageSelect(index: number, file: File | null) {
    setOptions((prev) => {
      const next = [...prev];
      const preview = file ? URL.createObjectURL(file) : null;
      next[index] = { ...next[index], imageFile: file, imagePreview: preview };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3 || trimmedQuestion.length > 200) {
      setError("Soru metni 3 ile 200 karakter arasında olmalıdır.");
      return;
    }

    if (options.length < 2 || options.length > 5) {
      setError("En az 2, en fazla 5 seçenek belirlemelisiniz.");
      return;
    }

    for (const opt of options) {
      const t = opt.text.trim();
      if (!t || t.length > 100) {
        setError("Tüm seçenekler 1 ile 100 karakter arasında doldurulmalıdır.");
        return;
      }
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Görselleri Supabase Storage'a yükleme
    const preparedOptions: { text: string; image_url: string | null }[] = [];

    for (const opt of options) {
      let imageUrl: string | null = null;

      if (opt.imageFile) {
        const fileExt = opt.imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("poll-images")
          .upload(filePath, opt.imageFile);

        if (uploadError) {
          setError(`Görsel yüklenemedi: ${uploadError.message}`);
          setSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("poll-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      preparedOptions.push({
        text: opt.text.trim(),
        image_url: imageUrl,
      });
    }

    // create_poll RPC fonksiyonunu çağırma
    const { error: rpcError } = await supabase.rpc("create_poll", {
      p_question: trimmedQuestion,
      p_options: preparedOptions,
    });

    if (rpcError) {
      setError(rpcError.message || "Anket oluşturulurken bir hata meydana geldi.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Soru Girişi */}
      <div>
        <label className="block text-sm font-semibold text-gray-800">Anket Sorun</label>
        <textarea
          required
          rows={3}
          minLength={3}
          maxLength={200}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Bugün sinemaya mı gitsem, restorana mı?"
          className="mt-1.5 w-full rounded-xl border border-gray-300 p-3 text-sm shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="mt-1 flex justify-between text-[11px] text-gray-400">
          <span>En az 3, en fazla 200 karakter</span>
          <span>{question.length}/200</span>
        </div>
      </div>

      {/* Seçenekler */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800">Seçenekler (2 - 5)</label>
          <span className="text-xs text-gray-400">{options.length}/5 Seçenek</span>
        </div>

        {options.map((opt, idx) => (
          <PollOptionInput
            key={opt.id}
            index={idx}
            text={opt.text}
            imagePreview={opt.imagePreview}
            canRemove={options.length > 2}
            onTextChange={(val) => handleTextChange(idx, val)}
            onImageSelect={(file) => handleImageSelect(idx, file)}
            onRemove={() => handleRemoveOption(idx)}
          />
        ))}

        {options.length < 5 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-50/50"
          >
            <Plus className="h-4 w-4" />
            <span>Seçenek Ekle</span>
          </button>
        )}
      </div>

      {/* Gönder Butonu */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Anket Yayınlanıyor...</span>
          </div>
        ) : (
          "Anketi Yayınla"
        )}
      </button>
    </form>
  );
}
