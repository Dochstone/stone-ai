import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";

export const runtime = "edge";
export const alt = "Stone AI — Генерация видео нейросетью";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="Генерация видео нейросетью"
        subtitle="Sora 2, Veo 3.1, Kling 3.0, Luma — 13 моделей для видео из текста и фото. От $0.15 за клип"
        category="AI Видео"
      />
    ),
    { ...size }
  );
}
