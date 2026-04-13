import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";

export const runtime = "edge";
export const alt = "Stone AI — Тарифы и цены";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="Тарифы Stone AI от 590 ₽"
        subtitle="Free · Start · Pro · Elite. Все 65+ моделей в одной подписке. Оплата картами РФ, СБП, криптой, TON"
        category="Цены"
      />
    ),
    { ...size }
  );
}
