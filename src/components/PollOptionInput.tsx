"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

interface PollOptionInputProps {
  index: number;
  text: string;
  imagePreview: string | null;
  canRemove: boolean;
  onTextChange: (text: string) => void;
  onImageSelect: (file: File | null) => void;
  onRemove: () => void;
}

export function PollOptionInput({
  index,
  text,
  imagePreview,
  canRemove,
  onTextChange,
  onImageSelect,
  onRemove,
}: PollOptionInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFileError("Görsel boyutu en fazla 2MB olabilir.");
      return;
    }

    setFileError(null);
    onImageSelect(file);
  }

  return (
    <div className="border border-line bg-white p-2.5 transition-colors focus-within:border-ink">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[10px] font-semibold transition-colors ${
            text.trim()
              ? "border-ink bg-ink text-paper"
              : "border-ink/20 text-ink/65"
          }`}
        >
          {String.fromCharCode(65 + index)}
        </span>

        <input
          type="text"
          required
          maxLength={100}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Seçenek ${index + 1}`}
          aria-label={`Seçenek ${index + 1} metni`}
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Görsel ekle (opsiyonel)"
          aria-label="Görsel ekle"
          className={`flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
            imagePreview
              ? "border-ink bg-signal text-ink"
              : "border-transparent text-ink/35 hover:border-ink hover:text-ink"
          }`}
        >
          <ImagePlus className="h-4 w-4" />
        </button>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Seçeneği kaldır"
            aria-label="Seçeneği kaldır"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-ink/35 transition-colors hover:border-ink hover:text-alert"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {fileError && (
        <p className="mt-2 pl-9 font-mono text-[9px] uppercase tracking-[0.04em] text-alert">
          {fileError}
        </p>
      )}

      {imagePreview && (
        <div className="mt-2.5 flex items-start gap-3 border-t border-line pt-2.5">
          <div className="relative h-20 w-28 shrink-0 border border-line bg-smoke">
            <Image
              src={imagePreview}
              alt="Seçenek görseli önizlemesi"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink/65">
              Görsel eklendi
            </p>
            <p className="mt-1 font-mono text-[9px] text-ink/70">
              Seçenek {index + 1}
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFileError(null);
                  onImageSelect(null);
                }}
                className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-alert underline underline-offset-2 transition-colors hover:bg-signal hover:text-ink hover:no-underline"
              >
                Kaldır
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-ink/65 underline underline-offset-2 transition-colors hover:text-ink"
              >
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
