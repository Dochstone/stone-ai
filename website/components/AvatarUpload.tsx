"use client";

import { useState, useEffect, memo } from "react";
import { getAvatarColor, getInitials, getSavedAvatar, saveAvatar, syncAvatarFromProfile } from "@/lib/avatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

function getToken(): string {
  try {
    return JSON.parse(localStorage.getItem("stone_auth") || "{}").token || "";
  } catch {
    return "";
  }
}

function AvatarUploadInner({ email, name }: { email: string; name?: string | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const local = getSavedAvatar();
    if (local) setAvatarUrl(local);
    syncAvatarFromProfile().then((url) => { if (url) setAvatarUrl(url); });
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.url ?? null;
      setAvatarUrl(url);
    };
    window.addEventListener("avatar-changed", handler);
    window.addEventListener("focus", () => {
      syncAvatarFromProfile().then((url) => { if (url) setAvatarUrl(url); });
    });
    return () => {
      window.removeEventListener("avatar-changed", handler);
    };
  }, []);

  const handleRemove = async () => {
    try {
      await fetch(`${API_URL}/api/user/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      localStorage.removeItem("stone_avatar");
      window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: null } }));
      setAvatarUrl(null);
    } catch {}
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border border-text/10 shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Аватарка" className="w-full h-full object-cover" onError={() => setAvatarUrl(null)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(email) }}>
            <span className="text-xl font-bold text-white">{getInitials(email, name)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <a
          href={`${API_URL}/api/user/avatar-test`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Загрузить фото
        </a>
        {avatarUrl && (
          <button type="button" onClick={handleRemove} className="text-xs text-red-400 hover:text-red-300 transition-colors text-left">
            Удалить фото
          </button>
        )}
      </div>
    </div>
  );
}

export const AvatarUpload = memo(AvatarUploadInner);
