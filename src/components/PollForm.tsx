"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PollOptionInput } from "./PollOptionInput";
import { AlertCircle, ArrowUpRight, Loader2, Plus } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border border-line border-l-2 border-l-alert bg-white p-3 text-xs leading-relaxed text-ink"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
          <span>{error}</span>
        </div>
      )}

      {/* Soru */}
      <section>
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl italic leading-none text-alert">01</span>
            <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink">
              Anket sorun
            </h2>
          </div>
          <span
            className={`font-mono text-[9px] tabular-nums ${
              question.length > 180 ? "text-alert" : "text-ink/65"
            }`}
          >
            {question.length}/200
          </span>
        </div>

        <textarea
          required
          rows={3}
          minLength={3}
          maxLength={200}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Bugün sinemaya mı gitsem, restorana mı?"
          aria-label="Anket sorunuz"
          className="mt-3 w-full resize-none border border-line bg-paper/40 p-4 font-serif text-xl leading-snug tracking-[-0.01em] text-ink transition-colors placeholder:text-ink/30 focus:border-ink focus:bg-white focus:outline-none focus:ring-1 focus:ring-ink sm:text-2xl"
        />

        <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-ink/65">
          <span>En az 3, en fazla 200 karakter</span>
          <span>{question.trim().length < 3 ? "Eksik" : "Uygun"}</span>
        </div>
      </section>

      {/* Seçenekler */}
      <section>
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl italic leading-none text-alert">02</span>
            <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink">
              Seçenekler
            </h2>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink/65">
            {options.length} / 5
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
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
        </div>

        {options.length < 5 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-2.5 flex w-full items-center justify-center gap-2 border border-dashed border-ink/30 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/65 transition-colors hover:border-ink hover:bg-smoke hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
            Seçenek ekle
          </button>
        )}
      </section>

      {/* Gönder */}
      <div className="border-t border-line pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="group flex w-full items-center justify-center gap-3 bg-ink py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Yayınlanıyor</span>
            </>
          ) : (
            <>
              <span>Anketi yayınla</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <p className="mt-2.5 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-ink/65">
          Yayınladıktan sonra soru ve seçenekler düzenlenemez
        </p>
      </div>
    </form>
  );
}
