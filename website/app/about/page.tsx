import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О Stone AI — команда, миссия, технологии",
  description:
    "Stone AI — российская платформа доступа к 65+ нейросетям. Узнайте о нашей команде, миссии и технологиях. Работаем с 2025 года.",
  alternates: { canonical: "/about" },
};

const stats = [
  { value: "65+", label: "AI-моделей", desc: "от 15 мировых компаний" },
  { value: "15", label: "провайдеров", desc: "OpenAI, Anthropic, Google, Meta..." },
  { value: "3", label: "способа оплаты", desc: "Stars, крипто, TON" },
  { value: "2025", label: "год основания", desc: "работаем стабильно" },
];

const values = [
  {
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    title: "Доступность",
    desc: "Нейросети должны быть доступны каждому — с оплатой в рублях, без дорогих подписок. Мы убираем барьеры между пользователями и лучшими AI-технологиями мира.",
  },
  {
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Прозрачные цены",
    desc: "Подписка от 390₽/мес — без скрытых комиссий. Бесплатный тариф с 15 запросами в день. 4 тарифа: Free, Start, Pro, Elite — выбирайте под свои задачи.",
  },
  {
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    title: "Безопасность",
    desc: "Stone AI не хранит содержимое ваших запросов. Все данные передаются напрямую провайдерам AI по зашифрованному каналу. Платежи обрабатываются через сертифицированных партнёров.",
  },
  {
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-1.5-3-1.5-3 1.5 3 1.5zm0 0v3.75",
    title: "Все инструменты в одном месте",
    desc: "Чат, генерация картинок, видео, 3D, аудио, поиск в интернете, анализ документов, перевод и код — 65+ нейросетей в одном окне. Не нужно 10 разных подписок.",
  },
];

const timeline = [
  { year: "2025", event: "Запуск Stone AI как Telegram-бота с 10 AI-моделями" },
  { year: "2025", event: "Добавлены генерация картинок, система подписок, 3 способа оплаты" },
  { year: "2026", event: "Расширение до 65+ моделей. Видео, 3D, аудио. Веб-чат и сайт stoneai.ru" },
  { year: "2026", event: "Запуск API для разработчиков, реферальная программа" },
];

const techStack = [
  { name: "OpenAI", models: "GPT-5.1, GPT-4o, o3" },
  { name: "Anthropic", models: "Claude Opus 4, Sonnet 4, Haiku 4.5" },
  { name: "Google", models: "Gemini 2.5 Pro, Gemini Flash" },
  { name: "Meta", models: "Llama 4 Maverick, Scout" },
  { name: "xAI", models: "Grok 3, Grok 3 Mini" },
  { name: "DeepSeek", models: "R1, V3" },
  { name: "Mistral", models: "Mistral Large, Devstral" },
  { name: "Perplexity", models: "Sonar, Sonar Pro, Deep Research" },
];

export default function AboutPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            О компании
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6">
            Делаем нейросети доступными
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              для каждого
            </span>
          </h1>
          <p className="text-text/60 text-lg max-w-2xl mx-auto leading-relaxed">
            STONE AI — Smart Technology Omniscient Neural Engine — умный нейронный движок, который объединяет
            65+ нейросетей от ведущих мировых компаний в одном окне. Одна подписка вместо пяти, с оплатой в рублях.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-text/5 p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-accent mb-1">{s.value}</div>
              <div className="font-bold text-sm mb-1">{s.label}</div>
              <div className="text-text/40 text-xs">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">Наши принципы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-text/5 p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-text/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">История развития</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-16 text-right">
                  <span className="text-sm font-bold text-accent">{t.year}</span>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-accent" />
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[3px] top-4 w-0.5 h-full bg-text/10" />
                  )}
                </div>
                <p className="text-text/70 text-sm leading-relaxed pl-4">{t.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Partners */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">Технологические партнёры</h2>
          <p className="text-text/50 text-center mb-10 max-w-lg mx-auto">
            Мы интегрируем модели напрямую от ведущих AI-компаний мира
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techStack.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-text/5 p-4">
                <div className="font-bold text-sm mb-1">{t.name}</div>
                <div className="text-text/40 text-xs">{t.models}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl border border-text/5 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-extrabold mb-4">Связаться с нами</h2>
          <p className="text-text/50 text-sm mb-8 max-w-md mx-auto">
            Вопросы, предложения, сотрудничество — пишите в Telegram
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://t.me/StoneAIsupport"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-colors"
            >
              Написать в поддержку
            </a>
            <a
              href="https://t.me/drifttt55bot"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-text/15 text-text px-8 py-3.5 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors"
            >
              Открыть бота
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
