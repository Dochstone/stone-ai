"use client";

import { useState, useEffect, useRef, memo } from "react";
import {
  canLoadImage,
  getAvatarColor,
  getInitials,
  getSavedAvatar,
  processAvatarFile,
  removeAvatar,
  saveAvatar,
  saveServerAvatar,
  syncAvatarFromProfile,
  uploadAvatarToServer,
} from "@/lib/avatar";

function AvatarUploadInner({ email, name }: { email: string; name?: string | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const local = getSavedAvatar();
    if (local) setAvatarUrl(local);
    syncAvatarFromProfile().then((url) => {
      setAvatarUrl(url);
    });
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.url ?? null;
      setAvatarUrl(url);
    };
    window.addEventListener("avatar-changed", handler);
    return () => {
      window.removeEventListener("avatar-changed", handler);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    previewObjectUrlRef.current = URL.createObjectURL(file);
    setAvatarUrl(previewObjectUrlRef.current);

    try {
      const previewUrl = await processAvatarFile(file);
      saveAvatar(previewUrl);
      setAvatarUrl(previewUrl);

      const fullUrl = await uploadAvatarToServer(previewUrl);
      saveServerAvatar(fullUrl);

      const reachable = await canLoadImage(fullUrl);
      if (reachable) {
        saveAvatar(fullUrl);
        setAvatarUrl(fullUrl);
        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current);
          previewObjectUrlRef.current = null;
        }
      } else {
        setError("Avatar was processed, but the remote image URL is not opening yet");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await removeAvatar();
      setAvatarUrl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove avatar");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openFilePicker}
            className="relative group shrink-0 cursor-pointer bg-transparent border-0 p-0"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border border-text/10">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setAvatarUrl(getSavedAvatar());
                    setError("Avatar image could not be opened");
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(email) }}>
                  <span className="text-xl font-bold text-white">{getInitials(email, name)}</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
          </button>

          {avatarUrl && !uploading && (
            <button type="button" onClick={handleRemove} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Delete photo
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400 max-w-xs leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}

export const AvatarUpload = memo(AvatarUploadInner);
