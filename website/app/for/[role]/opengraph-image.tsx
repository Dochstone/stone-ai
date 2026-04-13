import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";
import { PROFESSIONS } from "@/lib/seo-data";

export const runtime = "edge";
export const alt = "Stone AI — AI для профессионалов";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: { role: string };
}

export default async function Image({ params }: Props) {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  const title = prof?.title || "AI для профессионалов";
  const subtitle = prof?.description || "Stone AI для специалистов";
  const truncatedSubtitle = subtitle.length > 180 ? subtitle.slice(0, 177) + "…" : subtitle;

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        subtitle={truncatedSubtitle}
        category="Для профессионалов"
      />
    ),
    { ...size }
  );
}
