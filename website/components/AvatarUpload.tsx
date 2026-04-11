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
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const local = getSavedAvatar();
    if (local) setAvatarUrl(local);
    syncAvatarFromProfile().then((url) => { if (url) setAvatarUrl(url); });
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.url ?? null;
      setAvatarUrl(url);
    };
    window.addEventListener("avatar-changed", handler);
    return () => window.removeEventListener("avatar-changed", handler);
  }, []);

  const upload = async (file: File) => {
    setStatus(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/user/avatar-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка ${res.status}`);
      }
      const data = await res.json();
      const fullUrl = data.avatar_url?.startsWith("http") ? data.avatar_url : `${API_URL}${data.avatar_url}`;
      saveAvatar(fullUrl);
      setAvatarUrl(fullUrl);
      setStatus("Аватарка загружена!");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setStatus(null);
    try {
      await fetch(`${API_URL}/api/user/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      localStorage.removeItem("stone_avatar");
      window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: null } }));
      setAvatarUrl(null);
      setStatus("Аватарка удалена");
    } catch {
      setStatus("Ошибка удаления");
    }
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
        {uploading ? (
          <div className="flex items-center gap-2 text-xs text-text/50">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Загрузка...
          </div>
        ) : (
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Загрузить фото
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {avatarUrl && !uploading && (
          <button type="button" onClick={handleRemove} className="text-xs text-red-400 hover:text-red-300 transition-colors text-left">
            Удалить фото
          </button>
        )}
        {status && <p className="text-xs text-text/50">{status}</p>}
      </div>
    </div>
  );
}

export const AvatarUpload = memo(AvatarUploadInner);
