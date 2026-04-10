const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const AVATAR_KEY = "stone_avatar";

function getAuthToken(): string {
  try {
    const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
    return auth.token || "";
  } catch {
    return "";
  }
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
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AVATAR_KEY);
}

export function processAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Файл должен быть изображением"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Файл слишком большой (макс. 10 МБ)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
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
    throw new Error(err?.message || `Ошибка сервера: ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok || !data.avatar_url) throw new Error("Сервер не вернул URL аватарки");
  return `${API_URL}${data.avatar_url}`;
}

export function saveAvatar(fullUrl: string): void {
  localStorage.setItem(AVATAR_KEY, fullUrl);
  window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: fullUrl } }));
}

export async function removeAvatar(): Promise<void> {
  const token = getAuthToken();
  await fetch(`${API_URL}/api/user/avatar`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
  localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new CustomEvent("avatar-changed", { detail: { url: null } }));
}

export async function syncAvatarFromProfile(): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data.user || data;
    const serverUrl = u?.avatar_url ? `${API_URL}${u.avatar_url}` : null;
    const localUrl = localStorage.getItem(AVATAR_KEY);
    if (serverUrl && serverUrl !== localUrl) {
      saveAvatar(serverUrl);
      return serverUrl;
    }
    return localUrl;
  } catch {
    return localStorage.getItem(AVATAR_KEY);
  }
}
