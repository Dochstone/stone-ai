const AVATAR_KEY = "stone_avatar";
const MAX_SIZE = 128; // px — resize to 128x128 for localStorage efficiency

export function getAvatarColor(email: string): string {
  const colors = ["#C4623D", "#0E9A83", "#4285f4", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#10a37f"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(email: string, name?: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
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

/** Resize image file to MAX_SIZE square, return base64 data URL */
export function processAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Только изображения"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext("2d")!;
        // Center crop
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_SIZE, MAX_SIZE);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}
