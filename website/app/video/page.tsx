import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";

export const metadata: Metadata = {
  title: "AI Генерация видео — Kling, Runway, Pika | Stone AI",
  description: "Генерируйте видео из текста и фото. Kling v2, Runway Gen-3, Pika 2.0, Stable Video, Luma Dream Machine. От $0.15 за видео.",
};

const modelIds = ["kling-v2", "runway-gen3", "pika-2", "stable-video", "luma-dream"];

const modelDescriptions: Record<string, string> = {
  "kling-v2": "Высокое качество от Kuaishou. 5-10 секунд видео, реалистичное движение.",
  "runway-gen3": "Флагман Runway. Кинематографическое качество, сложные сцены.",
  "pika-2": "Быстрая и доступная генерация. Идеальна для коротких клипов.",
  "stable-video": "Стабильное качество от Stability AI. 4 секунды, низкая цена.",
  "luma-dream": "Dream Machine от Luma. Плавные переходы, хорошая физика.",
};

const examples = [
  { prompt: "Котёнок играет с клубком шерсти на солнечном подоконнике", tag: "Анимация" },
  { prompt: "Промо-ролик для кофейни: латте-арт, пар, утренний свет", tag: "Промо" },
  { prompt: "Космический корабль пролетает мимо кольцевой планеты", tag: "Визуализация" },
];

const faqItems = [
  { q: "Сколько времени занимает генерация?", a: "От 4 до 30 секунд в зависимости от модели. Pika и Stable Video — быстрее всех. Kling и Runway — дольше, но качественнее." },
  { q: "Можно ли анимировать свою фотографию?", a: "Да! Загрузите фото и опишите движение. Поддерживают image-to-video: Kling, Runway, Stable Video." },
  { q: "Какой формат видео?", a: "MP4 файл, который можно скачать и использовать где угодно. Длительность: 3-10 секунд." },
  { q: "Почему списание до генерации?", a: "Видео-генерация требует больших вычислительных ресурсов. Баланс списывается перед началом. Если генерация не удалась — деньги возвращаются автоматически." },
];

export default function VideoPage() {
  return (
    <>
      <ToolPageHero
        badge="5 видео-моделей"
        title="AI Генерация видео"
        highlight="из текста и фото"
        description="Kling v2, Runway Gen-3, Pika 2.0, Stable Video, Luma Dream Machine. Создавайте видео за секунды. От $0.15 за клип."
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
          <video src="/demo/video-neon.mp4" controls playsInline muted loop autoPlay className="w-full rounded-2xl shadow-lg" />
        </div>
      </section>

      <ToolExamples subtitle="Попробуйте эти промты" examples={examples} />
      <ToolFaq items={faqItems} />
      <ToolCta title="Создайте первое видео" subtitle="Опишите сцену — AI сгенерирует видео за 5-30 секунд." ctaHref="/webchat?category=video" />
    </>
  );
}
