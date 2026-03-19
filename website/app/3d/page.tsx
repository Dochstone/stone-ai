import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";

export const metadata: Metadata = {
  title: "3D Генерация — из текста и фото в 3D модель | Stone AI",
  description: "Генерируйте 3D модели из текста и фотографий. Tripo v2.5, TripoSR. GLB формат для игр, печати, визуализации. От $0.21 за модель.",
};

const modelIds = ["tripo-v2.5", "triposr"];

const modelDescriptions: Record<string, string> = {
  "tripo-v2.5": "Text/Image → 3D с PBR текстурами. Высокое качество, 25-100 секунд.",
  "triposr": "Image → 3D мгновенно (<1 секунда). Идеален для быстрого прототипа.",
};

const examples = [
  { prompt: "Загрузите фото кроссовки → получите 3D модель для маркетплейса", tag: "Product" },
  { prompt: "Средневековый замок на холме с башнями и мостом", tag: "Game Asset" },
  { prompt: "Фигурка персонажа из фото для 3D печати", tag: "3D Печать" },
];

const faqItems = [
  { q: "Какой формат 3D модели?", a: "GLB (glTF Binary) — универсальный формат. Открывается в Blender, Unity, Unreal Engine, браузерах. Можно сразу использовать в играх или отправить на 3D печать." },
  { q: "Можно ли создать 3D из текста?", a: "Да! Tripo v2.5 поддерживает text-to-3D. Опишите объект текстом — AI сгенерирует полноценную 3D модель. TripoSR работает только с изображениями." },
  { q: "Сколько времени занимает генерация?", a: "TripoSR — менее 1 секунды (мгновенно). Tripo v2.5 — от 25 до 100 секунд в зависимости от сложности." },
  { q: "Можно ли посмотреть 3D модель в браузере?", a: "Да! После генерации модель отображается прямо в чате с возможностью вращения, зума и скачивания GLB файла." },
];

export default function ThreeDPage() {
  return (
    <>
      <ToolPageHero
        badge="Text/Image → 3D"
        title="3D модели из текста"
        highlight="и фотографий"
        description="Tripo v2.5 и TripoSR генерируют 3D модели в формате GLB. Для игр, 3D печати, визуализации продуктов."
      />
      <ToolModels
        title="3D модели"
        subtitle="Выберите скорость или качество"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />
      <ToolExamples subtitle="Примеры использования" examples={examples} />
      <ToolFaq items={faqItems} />
      <ToolCta title="Создайте 3D модель" subtitle="Загрузите фото или опишите объект — получите GLB за секунды." ctaHref="/webchat?category=3d" />
    </>
  );
}
