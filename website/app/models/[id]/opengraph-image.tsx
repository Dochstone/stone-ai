import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgTemplate } from "@/lib/og-template";
import { MODELS } from "@/lib/models";

export const runtime = "edge";
export const alt = "Stone AI — AI Модель";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const CATEGORY_LABELS: Record<string, string> = {
  chat: "Чат",
  image: "Картинки",
  video: "Видео",
  "3d": "3D",
  reason: "Reasoning",
  search: "Поиск",
  code: "Код",
};

interface Props {
  params: { id: string };
}

export default async function Image({ params }: Props) {
  const model = MODELS.find((m) => m.id === params.id);
  const title = model?.name || "Модель AI";
  const subtitle = model?.description || "Попробуйте модель в Stone AI";
  const category = model ? `${CATEGORY_LABELS[model.category] || model.category} · ${model.company}` : "AI Модель";

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        subtitle={subtitle.length > 180 ? subtitle.slice(0, 177) + "…" : subtitle}
        category={category}
      />
    ),
    { ...size }
  );
}
