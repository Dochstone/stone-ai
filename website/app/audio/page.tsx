import type { Metadata } from "next";
import Image from "next/image";
import ToolPageHero from "@/components/ToolPageHero";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Озвучка текста нейросетью — ИИ голосовой бот",
  description: "Нейросеть для озвучки текста 10+ голосами. ИИ чат-бот с голосовым вводом Whisper. TTS и STT онлайн. От $0.01.",
  alternates: { canonical: "/audio" },
};

const examples = [
  { prompt: "Озвучь статью для подкаста голосом Nova — мягким и профессиональным", tag: "Подкаст" },
  { prompt: "Продиктуй голосом вопрос — AI переведёт в текст и ответит", tag: "Голосовой ввод" },
  { prompt: "Прочитай детскую сказку голосом Shimmer — тёплым и дружелюбным", tag: "Озвучка" },
];

const faqItems = [
  { q: "Какие голоса доступны?", a: "9 голосов: Alloy (нейтральный), Echo (глубокий), Nova (мягкий), Shimmer (тёплый), Onyx (низкий), Fable (выразительный), Ash, Coral, Sage. Все на английском и русском." },
  { q: "Как работает голосовой ввод?", a: "Нажмите кнопку микрофона в чате, говорите до 30 секунд. Whisper AI мгновенно переведёт речь в текст. Поддерживает русский, английский и 50+ языков." },
  { q: "Сколько стоит озвучка?", a: "TTS и STT включены в подписку Start (590₽/мес) и выше. Количество озвучек зависит от тарифа: Start — 3/мес, Pro — 20/мес, Elite — 100/мес." },
  { q: "Максимальная длина текста для озвучки?", a: "До 4096 символов за один запрос (~2 минуты аудио). Для длинных текстов разбивайте на части." },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Аудио", item: `${SITE_URL}/audio` }] };

export default function AudioPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Stone AI — AI Аудио", applicationCategory: "MultimediaApplication", description: "Озвучка текста 10+ голосами, голосовой ввод через Whisper AI.", offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "10 бесплатных запросов в день" } }) }} />
      <ToolPageHero breadcrumb="AI Аудио"
        badge="Нейросеть для озвучки"
        title="ИИ Аудио — озвучка"
        highlight="и голосовой ввод"
        description="Нейросеть озвучивает текст 10+ голосами. ИИ чат-бот с голосовым вводом через Whisper. Мгновенно, на любом языке."
      />
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">Возможности</h2>
          <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">Два режима работы с аудио</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-text/5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Текст → Речь (TTS)</h3>
              <p className="text-text/60 text-sm">Нажмите 🔊 на любом ответе AI — и он будет озвучен. 9 голосов на выбор. Скачайте MP3.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-text/5">
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Речь → Текст (STT)</h3>
              <p className="text-text/60 text-sm">Нажмите 🎤 в чате — говорите голосом. Whisper AI мгновенно переведёт в текст. 50+ языков.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo audio */}
      <section className="py-16 md:py-20">
        <div className="max-w-md mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-6">Послушайте пример</h3>
          <div className="bg-white rounded-2xl border border-text/[0.06] p-6 shadow-lg">
            <div className="mb-4">
              <Image src="/demo/audio-poster.webp" alt="Audio waveform" width={400} height={225} className="w-full rounded-xl mb-4" />
            </div>
            <audio controls className="w-full" src="/demo/audio-demo.mp3" />
            <p className="text-xs text-text/40 mt-3">Голос: Nova · Язык: Русский</p>
          </div>
        </div>
      </section>

      <ToolExamples subtitle="Примеры использования" examples={examples} />
      <ToolFaq items={faqItems} />
      <ToolCta title="Попробуйте AI Аудио" subtitle="Озвучка и голосовой ввод — прямо в чате." ctaHref="/dashboard/chat" />
    </>
  );
}
