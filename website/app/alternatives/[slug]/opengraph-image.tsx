import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";
import { ALTERNATIVES } from "@/lib/seo-data";

export const runtime = "edge";
export const alt = "Stone AI — Альтернатива";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: { slug: string };
}

export default async function Image({ params }: Props) {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  const title = alt?.title || "Альтернатива нейросети";
  const subtitle = alt?.description || "Сравнение с Stone AI";
  const truncatedSubtitle = subtitle.length > 180 ? subtitle.slice(0, 177) + "…" : subtitle;

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        subtitle={truncatedSubtitle}
        category="Альтернативы"
      />
    ),
    { ...size }
  );
}
