import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import ModelViewerScript from "@/components/ModelViewerScript";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "3D генерация нейросетью — Скоро",
  description: "Подключаем новый провайдер 3D-генерации. Скоро Tripo через прямой API.",
  alternates: { canonical: "/3d" },
};

const modelIds: string[] = [];

const modelDescriptions: Record<string, string> = {};

const examples: { prompt: string; tag: string }[] = [];

const faqItems = [
  { q: "Когда заработает 3D?", a: "Подключаем Tripo напрямую через их платформу. Раньше работало через посредника (fal.ai), но они убрали Tripo из каталога. Сейчас восстанавливаем интеграцию." },
  { q: "Что будет в обновлении?", a: "Text/Image → 3D, GLB формат, прямой API Tripo. Цены ниже, качество тоже же." },
  { q: "Как узнать когда запустится?", a: "Подпишитесь на наш Telegram @stoneai — анонсируем там." },
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
      <ToolPageHero breadcrumb="3D Генерация"
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
      <ToolCta title="Создайте 3D модель" subtitle="Загрузите фото или опишите объект — получите GLB за секунды." ctaHref="/webchat?category=3d" />
    </>
  );
}
