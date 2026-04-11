const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const AVATAR_KEY = "stone_avatar";
const AVATAR_SERVER_KEY = "stone_avatar_server";
const MAX_AVATAR_SIZE = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeGetLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage failures should not block avatar upload/rendering.
  }
}

function safeRemoveLocalStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(avif|gif|heic|heif|jpe?g|png|svg|webp)$/i.test(file.name);
}

function getAuthToken(): string {
  try {
    const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
    return auth.token || "";
  } catch {
    return "";
  }
}

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export function getAvatarColor(email: string): string {
  const colors = ["#C4623D", "#0E9A83", "#4285f4", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#10a37f"];
  const str = email || "user";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(email: string, name?: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return (email || "U").slice(0, 2).toUpperCase();
}

export function getSavedAvatar(): string | null {
  return safeGetLocalStorageItem(AVATAR_KEY);
}

export function getSavedServerAvatar(): string | null {
  return safeGetLocalStorageItem(AVATAR_SERVER_KEY);
}

export function saveAvatar(url: string): void {
  safeSetLocalStorageItem(AVATAR_KEY, url);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url } }));
  }
}

export function saveServerAvatar(url: string): void {
  safeSetLocalStorageItem(AVATAR_SERVER_KEY, url);
}

export function clearSavedAvatar(): void {
  if (typeof window === "undefined") return;
  safeRemoveLocalStorageItem(AVATAR_KEY);
  safeRemoveLocalStorageItem(AVATAR_SERVER_KEY);
  window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: null } }));
}

export function canLoadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function processAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageLikeFile(file)) {
      reject(new Error("File must be an image"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("File is too large (max 10 MB)"));
      return;
    }

    readFileAsDataUrl(file)
      .then((dataUrl) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = MAX_AVATAR_SIZE;
        canvas.height = MAX_AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_AVATAR_SIZE, MAX_AVATAR_SIZE);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
      })
      .catch(reject);
  });
}

export async function uploadAvatarToServer(base64DataUrl: string): Promise<string> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/user/avatar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image_base64: base64DataUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Server error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok || !data.avatar_url) throw new Error("Server did not return avatar URL");
  return toAbsoluteUrl(data.avatar_url);
}

export async function uploadAvatarFileToServer(file: File): Promise<string> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/user/avatar-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Server error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok || !data.avatar_url) throw new Error("Server did not return avatar URL");
  return toAbsoluteUrl(data.avatar_url);
}

export async function removeAvatar(): Promise<void> {
  const token = getAuthToken();
  await fetch(`${API_URL}/api/user/avatar`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
  clearSavedAvatar();
}

export async function syncAvatarFromProfile(): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;

  const localAvatar = getSavedAvatar();

  try {
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return localAvatar;

    const data = await res.json();
    const u = data.user || data;
    const serverUrl = u?.avatar_url ? toAbsoluteUrl(u.avatar_url) : null;

    if (!serverUrl) {
      clearSavedAvatar();
      return null;
    }

    saveServerAvatar(serverUrl);

    if (localAvatar === serverUrl) {
      return serverUrl;
    }

    const reachable = await canLoadImage(serverUrl);
    if (reachable) {
      saveAvatar(serverUrl);
      return serverUrl;
    }

    return localAvatar;
  } catch {
    return localAvatar;
  }
}
