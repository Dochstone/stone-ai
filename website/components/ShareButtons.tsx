"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/blog/${slug}`);
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [slug]);

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // user cancelled — ignore
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#229ED9] text-white pl-3 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Поделиться в Telegram"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65 10.06 14.42 17.74 7.5c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
            Telegram
          </a>
          <a
            href={`https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#0077FF] text-white pl-3 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Поделиться во ВКонтакте"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 6.86c.17-.51 0-.88-.73-.88h-2.4c-.62 0-.9.33-1.07.69 0 0-1.23 3-2.98 4.95-.57.57-.82.75-1.13.75-.16 0-.38-.18-.38-.69V6.86c0-.62-.18-.88-.69-.88H8.43c-.38 0-.61.27-.61.52 0 .58.87.72.96 2.36v3.57c0 .76-.14.9-.44.9-.82 0-2.82-3.01-4-6.46-.23-.66-.46-.93-1.08-.93H.87c-.69 0-.83.33-.83.69 0 .64.82 3.81 3.81 8.01 2 2.87 4.81 4.43 7.37 4.43 1.54 0 1.73-.34 1.73-.94v-2.17c0-.69.14-.83.63-.83.36 0 .97.17 2.4 1.55 1.63 1.63 1.9 2.36 2.82 2.36h2.4c.69 0 1.04-.34.84-1.02-.22-.68-1-1.66-2.05-2.82-.57-.67-1.42-1.39-1.68-1.76-.36-.46-.25-.67 0-1.08.01 0 2.96-4.17 3.27-5.58z"/></svg>
            ВК
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white pl-3 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Поделиться в WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-1.77-.88-2.92-1.58-4.08-3.58-.3-.52.3-.48.87-1.62.1-.2.05-.37-.03-.52-.07-.15-.68-1.63-.92-2.22-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5 0 1.48 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 3.87c-4.5 0-8.17 3.67-8.17 8.17 0 1.53.43 3.02 1.24 4.32l-1.35 4.95 5.05-1.33c1.25.68 2.65 1.04 4.07 1.04h.01c4.5 0 8.17-3.67 8.17-8.17s-3.67-8.17-8.17-8.17c-.27 0-.54.01-.8.02v.17z"/></svg>
            WhatsApp
          </a>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-text text-bg pl-3 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              )}
            </svg>
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
      )}
      <button
        onClick={() => (canNative ? nativeShare() : setOpen((v) => !v))}
        aria-label="Поделиться статьёй"
        aria-expanded={open}
        className="w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 transition-all flex items-center justify-center"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
      </button>
    </div>
  );
}
