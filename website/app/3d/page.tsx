import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import ModelViewerScript from "@/components/ModelViewerScript";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "3D генерация нейросетью — ИИ из текста в 3D модель",
  description: "Нейросеть для 3D генерации из текста и фото. ИИ-модели Tripo v2.5, TripoSR. GLB для игр, печати. От $0.21.",
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

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "3D Генерация" }] };

export default function ThreeDPage() {
  return (
    <>
      <ModelViewerScript />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Stone AI — 3D Генерация", applicationCategory: "DesignApplication", description: "Генерация 3D моделей из текста и фото. Tripo v2.5, TripoSR. GLB формат.", offers: { "@type": "Offer", price: "0.21", priceCurrency: "USD" } }) }} />
      <ToolPageHero
        badge="Нейросеть для 3D"
        title="3D модели нейросетью"
        highlight="из текста и фото"
        description="ИИ-генератор 3D моделей: нейросети Tripo v2.5 и TripoSR. GLB формат для игр, 3D печати, визуализации."
      />
      <ToolModels
        title="3D модели"
        subtitle="Выберите скорость или качество"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />

      {/* Demo 3D model */}
      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h3 className="text-xl font-bold text-center mb-6">Пример 3D модели</h3>
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] shadow-lg bg-[#f0f0f0]" style={{ height: 400 }} dangerouslySetInnerHTML={{ __html: `<model-viewer src="/demo/model-demo.glb" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:400px;background:#f0f0f0" shadow-intensity="1" exposure="1.2"></model-viewer>` }} />
          <p className="text-center text-xs text-text/40 mt-3">Вращайте модель мышью или пальцем</p>
        </div>
      </section>

      <ToolExamples subtitle="Примеры использования" examples={examples} />
      <ToolFaq items={faqItems} />
      <ToolCta title="Создайте 3D модель" subtitle="Загрузите фото или опишите объект — получите GLB за секунды." ctaHref="/studio?category=3d" />
    </>
  );
}
