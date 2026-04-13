import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Генерация видео нейросетью — ИИ из текста в видео",
  description: "Нейросеть для генерации видео из текста и фото. ИИ-модели Sora 2, Veo 3, Kling 3.0, Pika 2.0. От $0.15 за видео.",
  alternates: { canonical: "/video" },
  openGraph: {
    title: "Генерация видео нейросетью — ИИ из текста в видео",
    description: "Нейросеть для генерации видео из текста и фото. ИИ-модели Sora 2, Veo 3, Kling 3.0, Pika 2.0. От $0.15 за видео.",
  },
};

const modelIds = ["sora-2", "veo-3", "kling-v2", "minimax", "pixverse-v5", "luma-dream", "pika-2", "wan-2", "hunyuan", "ltx-video", "stable-video"];

const modelDescriptions: Record<string, string> = {
  "sora-2": "Видео от OpenAI. Лучшая физика и точное следование промптам.",
  "veo-3": "Google Veo 3.1. Нативное 4K, лучший lip-sync и звуковой дизайн.",
  "kling-v2": "Топовая китайская модель Kling v2.1 Master. Лица, lip-sync, кинематографичные сцены 1080p.",
  "minimax": "Быстрая генерация. Анимация персонажей, плавное движение.",
  "pixverse-v5": "Кинематографичная камера, контроль сцены, плавные переходы.",
  "luma-dream": "Dream Machine от Luma. Реалистичная физика и переходы.",
  "pika-2": "Самая быстрая генерация (<90 сек). Идеальна для соцсетей.",
  "wan-2": "Самая дешёвая — $0.15. 1080p, быстрая, для массового контента.",
  "hunyuan": "Бюджетная модель от Tencent. Хорошее качество за копейки.",
  "ltx-video": "Самая дешёвая — $0.12. Open source, быстрая, со звуком.",
  "stable-video": "Классика от Stability AI. Стабильная и предсказуемая.",
};

const examples = [
  { prompt: "Котёнок играет с клубком шерсти на солнечном подоконнике", tag: "Анимация" },
  { prompt: "Промо-ролик для кофейни: латте-арт, пар, утренний свет", tag: "Промо" },
  { prompt: "Космический корабль пролетает мимо кольцевой планеты", tag: "Визуализация" },
];

const faqItems = [
  { q: "Сколько времени занимает генерация?", a: "От 4 до 30 секунд в зависимости от модели. Pika и Stable Video — быстрее всех. Sora и Veo 3 — дольше, но качественнее." },
  { q: "Можно ли анимировать свою фотографию?", a: "Да! Загрузите фото и опишите движение. Поддерживают image-to-video: Stable Video, Luma, Kling, PixVerse." },
  { q: "Какой формат видео?", a: "MP4 файл, который можно скачать и использовать где угодно. Длительность: 3-10 секунд." },
  { q: "Сколько видео включено в подписку?", a: "Считаем в видео-поинтах. Start — 13 поинтов + 2 пробных в месяц, Pro — 33 поинта, Elite — 80 поинтов. Дешёвое видео (720p/5s) = 1 поинт, премиум (1080p/10s) = 2-4 поинта. Если генерация не удалась — поинты не списываются." },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Видео", item: `${SITE_URL}/video` }] };

export default function VideoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Stone AI — AI Видео", applicationCategory: "MultimediaApplication", description: "Генерация видео из текста и фото. Sora 2, Veo 3, Kling 3.0, Pika 2.0.", offers: { "@type": "Offer", price: "0.15", priceCurrency: "USD" } }) }} />
      <ToolPageHero breadcrumb="AI Видео"
        badge="5 нейросетей для видео"
        title="Генерация видео нейросетью"
        highlight="из текста и фото"
        description="ИИ-генератор видео: Sora 2, Veo 3, Kling 3.0, Pika 2.0, Luma. Нейросеть создаёт видео за секунды. От $0.15 за клип."
      />
      <ToolModels
        title="Видео-модели"
        subtitle="Выберите модель под задачу — от быстрых до кинематографических"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />

      {/* Demo video */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-xl font-bold text-center mb-6">Пример генерации</h3>
          <video src="/demo/video-1.mp4" controls playsInline muted loop autoPlay className="w-full rounded-2xl shadow-lg" />
        </div>
      </section>

      <ToolExamples subtitle="Попробуйте эти промты" examples={examples} />
      <ToolFaq items={faqItems} />
      <ToolCta title="Создайте первое видео" subtitle="Опишите сцену — AI сгенерирует видео за 5-30 секунд." ctaHref="/webchat?category=video" />
    </>
  );
}
