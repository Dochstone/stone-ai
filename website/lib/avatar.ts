const AVATAR_KEY = "stone_avatar";

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

export function saveAvatar(dataUrl: string): void {
  localStorage.setItem(AVATAR_KEY, dataUrl);
  window.dispatchEvent(new Event("avatar-changed"));
}

export function removeAvatar(): void {
  localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new Event("avatar-changed"));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

export async function uploadAvatarToServer(base64: string): Promise<string | null> {
  try {
    const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
    if (!auth.token) return null;
    const res = await fetch(`${API_URL}/api/user/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ image_base64: base64 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar_url || null;
  } catch {
    return null;
  }
}

export async function deleteAvatarFromServer(): Promise<boolean> {
  try {
    const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
    if (!auth.token) return false;
    const res = await fetch(`${API_URL}/api/user/avatar`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Save avatar: upload to server + cache in localStorage */
export async function saveAvatarFull(base64: string): Promise<void> {
  const serverUrl = await uploadAvatarToServer(base64);
  // Cache locally for instant display
  saveAvatar(serverUrl ? `${API_URL}${serverUrl}` : base64);
}

/** Remove avatar from server + localStorage */
export async function removeAvatarFull(): Promise<void> {
  await deleteAvatarFromServer();
  removeAvatar();
}

/** Sync avatar from server profile data */
export function syncAvatarFromProfile(avatarUrl: string | null): void {
  if (avatarUrl) {
    const full = avatarUrl.startsWith("http") ? avatarUrl : `${API_URL}${avatarUrl}`;
    if (getSavedAvatar() !== full) {
      saveAvatar(full);
    }
  }
}
