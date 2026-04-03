"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  onUpload: (base64Data: string, previewUrl: string) => void;
  preview?: string;
  onClear?: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ onUpload, preview, onClear }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Формат не поддерживается. Используйте JPEG, PNG или WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Файл слишком большой. Максимум 10 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const previewUrl = URL.createObjectURL(file);
      onUpload(base64, previewUrl);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [processFile]);

  if (preview) {
    return (
      <div className="relative min-h-[200px] rounded-xl overflow-hidden border border-text/10 bg-text/[0.02]">
        <img src={preview} alt="Preview" className="w-full h-full object-contain max-h-[400px]" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center gap-3 p-6
          transition-all duration-200
          ${dragging
            ? "border-accent bg-accent/5"
            : "border-text/15 hover:border-accent bg-text/[0.02] hover:bg-text/[0.04]"
          }
        `}
      >
        <svg className="w-10 h-10 text-text/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-semibold text-text/50">
            Перетащите изображение сюда
          </p>
          <p className="text-xs text-text/30 mt-1">
            или нажмите для выбора файла
          </p>
          <p className="text-[10px] text-text/20 mt-2">
            JPEG, PNG, WebP до 10 МБ
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>
      )}
    </div>
  );
}
