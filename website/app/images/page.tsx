import type { Metadata } from "next";
import Image from "next/image";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Генерация картинок нейросетью — ИИ бесплатно онлайн",
  description:
    "Генерация картинок нейросетью в Telegram. ИИ-генератор: Flux, GPT-5 Image, SDXL. От $0.012 за картинку.",
  openGraph: {
    title: "Генерация картинок AI — Flux, GPT-5 Image, SDXL",
    description: "Создавайте AI-изображения в Telegram. 6 моделей, от $0.012 за картинку.",
  },
};

const modelIds = [
  "nano-banana-pro",
  "gpt-5-image",
  "gpt-5-image-mini",
  "flux-schnell",
  "stable-diffusion-xl",
  "nano-banana",
];

const modelDescriptions: Record<string, string> = {
  "nano-banana-pro": "Лучшее качество. Генерация и редактирование через Gemini 3 Pro. Фотореализм.",
  "gpt-5-image": "Топовая генерация от OpenAI. Понимает сложные промпты, точно следует инструкциям.",
  "gpt-5-image-mini": "Быстрая генерация от OpenAI. Хорошее качество за меньшую цену.",
  "flux-schnell": "Самая дешёвая генерация — $0.012 за картинку. Быстро, стильно, креативно.",
  "stable-diffusion-xl": "Классика AI-арта. $0.04 за картинку. Огромное количество стилей.",
  "nano-banana": "Редактирование существующих изображений через Gemini Flash. Дёшево и быстро.",
};

const examples = [
  { prompt: "Фотореалистичный портрет девушки-программиста за ноутбуком в уютном кафе, мягкий свет из окна, bokeh", tag: "Фотореализм" },
  { prompt: "Минималистичный логотип для AI-стартапа: абстрактный мозг из геометрических фигур, синий и белый", tag: "Логотипы" },
  { prompt: "Flat illustration для мобильного приложения: человек медитирует среди природы, пастельные тона", tag: "Иллюстрации" },
  { prompt: "Мем в стиле Shiba Inu в костюме, сидящего на троне из денег, подпись: 'When AI writes your code'", tag: "Мемы" },
  { prompt: "Обложка для Telegram-канала про инвестиции: графики роста, золотые монеты, тёмный фон, 1280x720", tag: "Соцсети" },
  { prompt: "Концепт-арт: космическая станция над Марсом, закат, в стиле Syd Mead, кинематографическое освещение", tag: "Концепт-арт" },
];

const faqItems = [
  {
    q: "Какие форматы изображений поддерживаются?",
    a: "Все модели генерируют PNG. Flux и SDXL создают картинки 1024x1024 по умолчанию. GPT-5 Image поддерживает разные соотношения сторон. Nano Banana Pro может редактировать загруженные изображения.",
  },
  {
    q: "Можно ли редактировать существующие изображения?",
    a: "Да! Nano Banana Pro и Nano Banana умеют редактировать: удалить фон, изменить стиль, добавить элементы. Загрузите картинку и опишите, что нужно изменить.",
  },
  {
    q: "Сколько стоит одна картинка?",
    a: "Flux Schnell — $0.012 за картинку, SDXL — $0.04, GPT-5 Image Mini — от $0.01 (зависит от промпта), GPT-5 Image — от $0.05, Nano Banana Pro — от $0.05. Самый бюджетный вариант — Flux по $0.012.",
  },
  {
    q: "Какая модель лучше для фотореализма?",
    a: "Nano Banana Pro (Gemini 3) и GPT-5 Image дают лучший фотореализм. Flux Schnell хорош для стилизованных и креативных изображений. SDXL — для художественного стиля.",
  },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Картинки" }] };

export default function ImagesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <ToolPageHero breadcrumb="Генерация картинок"
        badge="6 нейросетей для картинок"
        title="Генерация картинок"
        highlight="нейросетью бесплатно"
        description="Нейросети Flux, GPT-5 Image, Nano Banana Pro. Фотореализм, иллюстрации, логотипы, мемы — ИИ генератор от $0.012 за картинку."
      />
      <ToolModels
        title="Модели для генерации картинок"
        subtitle="От бюджетного Flux до премиального GPT-5 Image"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />

      {/* AI-generated gallery */}
      <section className="py-16 md:py-20 bg-bg">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-xl font-bold text-center mb-6">Примеры работ</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { src: "/demo/img-cosmos.webp", label: "Неоновый город" },
              { src: "/demo/img-portrait.webp", label: "Космический портрет" },
              { src: "/demo/img-landscape.webp", label: "Горный пейзаж" },
              { src: "/demo/img-fantasy.webp", label: "Фэнтези мир" },
              { src: "/demo/img-robot.webp", label: "3D персонаж" },
              { src: "/demo/img-food.webp", label: "Фуд-фото" },
              { src: "/demo/img-abstract.webp", label: "Абстракция" },
              { src: "/demo/img-architecture.webp", label: "Архитектура" },
            ].map((img) => (
              <div key={img.label} className="relative rounded-xl overflow-hidden aspect-square group">
                <Image src={img.src} alt={img.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-8">
                  <span className="text-[11px] font-semibold text-white">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ToolExamples
        title="Примеры промптов"
        subtitle="Опишите картинку — AI создаст её за секунды"
        examples={examples}
      />
      <ToolFaq items={faqItems} />
      <ToolCta title="Создайте первую картинку" subtitle="Flux Schnell — $0.012 за изображение. Попробуйте прямо сейчас." />
    </>
  );
}
