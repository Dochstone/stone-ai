import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";

export const runtime = "edge";
export const alt = "Stone AI — агрегатор 65+ нейросетей в одном чате";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="Агрегатор нейросетей"
        subtitle="65+ моделей в одном чате: GPT-5, Claude Opus, Midjourney, Sora. Без VPN, оплата в рублях"
        category="Stone AI"
      />
    ),
    { ...size }
  );
}
