import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";

export const runtime = "edge";
export const alt = "Stone AI — 65+ нейросетей в одном месте";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="65+ нейросетей в одном месте"
        subtitle="GPT, Claude, Gemini, Midjourney, Kling — в одной подписке, без VPN, оплата российскими картами"
        category="AI Студия"
      />
    ),
    { ...size }
  );
}
