import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";
import { POSTS } from "@/lib/blog";

export const runtime = "edge";
export const alt = "Stone AI Блог";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: { slug: string };
}

export default async function Image({ params }: Props) {
  const post = POSTS.find((p) => p.slug === params.slug);
  const title = post?.title || "Stone AI Блог";
  const subtitle = post?.description || "Гайды, обзоры и инсайды о нейросетях в 2026";
  const truncatedSubtitle = subtitle.length > 180 ? subtitle.slice(0, 177) + "…" : subtitle;

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        subtitle={truncatedSubtitle}
        category="Блог"
      />
    ),
    { ...size }
  );
}
