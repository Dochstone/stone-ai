"use client";

import { useState, useEffect, useCallback, memo } from "react";
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
  const [modalOpen, setModalOpen] = useState(false);

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

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    syncAvatarFromProfile().then((url) => {
      if (url) {
        saveAvatar(url);
        setAvatarUrl(url);
      }
    });
  }, []);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <>
      <div className="relative shrink-0">
        {/* Avatar circle */}
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border border-text/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Аватарка" className="w-full h-full object-cover" onError={() => setAvatarUrl(null)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(email) }}>
              <span className="text-xl font-bold text-white">{getInitials(email, name)}</span>
            </div>
          )}
        </div>

        {/* Camera badge — only when no avatar */}
        {!avatarUrl && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent border-2 border-bg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          >
            <svg className="w-3 h-3 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
        )}

        {/* Remove button — only when avatar exists */}
        {avatarUrl && (
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

      {/* Modal with iframe */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative bg-bg border border-text/10 rounded-2xl overflow-hidden w-[95vw] max-w-md h-[80vh] max-h-[600px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-text/10 hover:bg-text/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <iframe
              src={`${API_URL}/api/user/avatar-test`}
              className="w-full h-full border-0"
              title="Загрузить аватарку"
            />
          </div>
        </div>
      )}
    </>
  );
}

export const AvatarUpload = memo(AvatarUploadInner);
