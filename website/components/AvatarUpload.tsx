"use client";

import { useState, useEffect, useRef, memo } from "react";
import { getAvatarColor, getInitials, getSavedAvatar, saveAvatar, syncAvatarFromProfile, processAvatarFile, uploadAvatarToServer } from "@/lib/avatar";

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
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const processed = await processAvatarFile(file);
      const serverUrl = await uploadAvatarToServer(processed);
      saveAvatar(serverUrl);
      setAvatarUrl(serverUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploading(true);
    try {
      await fetch(`${API_URL}/api/user/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      localStorage.removeItem("stone_avatar");
      window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: null } }));
      setAvatarUrl(null);
    } catch {
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => !uploading && fileRef.current?.click()}
        className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border border-text/10 relative cursor-pointer group"
        style={{ backgroundColor: avatarUrl ? undefined : getAvatarColor(email) }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Аватарка"
            className="w-full h-full object-cover"
            onError={() => setAvatarUrl(null)}
          />
        ) : (
          <span className="text-xl font-bold text-white">
            {getInitials(email, name)}
          </span>
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center rounded-full">
            <svg
              className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
        )}

        {/* Spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Camera badge */}
      {!uploading && (
        <div
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent border-2 border-bg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        >
          <svg className="w-3 h-3 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
      )}

      {/* Remove button */}
      {avatarUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        >
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export const AvatarUpload = memo(AvatarUploadInner);
