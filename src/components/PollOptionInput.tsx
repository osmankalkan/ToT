"use client";

import Image from "next/image";
import { useRef } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Görsel boyutu en fazla 2MB olabilir.");
        return;
      }
      onImageSelect(file);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-600">
          {String.fromCharCode(65 + index)}
        </span>

        <input
          type="text"
          required
          maxLength={100}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Seçenek ${index + 1}`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          className={`rounded-lg p-2 transition ${
            imagePreview
              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <ImagePlus className="h-4 w-4" />
        </button>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Seçeneği kaldır"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {imagePreview && (
        <div className="relative inline-block overflow-hidden rounded-lg border border-gray-200">
          <Image
            src={imagePreview}
            alt="Önizleme"
            width={120}
            height={80}
            className="h-20 w-32 object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onImageSelect(null)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
