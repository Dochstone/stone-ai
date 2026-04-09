"use client";

import Link from "next/link";

const TOOLS = [
  {
    emoji: "🎯",
    title: "Рекламные кампании",
    desc: "Введи нишу → 50+ ключевых слов, объявления и минус-слова для Яндекс Директ",
    price: "от 29₽",
    href: "/dashboard/campaigns",
    color: "from-red-500 to-orange-500",
    features: ["50+ ключевых слов", "Частотность Wordstat", "Экспорт в XLSX"],
  },
  {
    emoji: "📊",
    title: "AI-Презентации",
    desc: "Тема → 10 слайдов за 30 секунд. 6 тем оформления, экспорт в PPTX",
    price: "от 40₽",
    href: "/dashboard/presentations",
    color: "from-purple-500 to-indigo-500",
    features: ["PPTX + PDF", "6 тем", "До 30 слайдов"],
  },
  {
    emoji: "📸",
    title: "Фотосессия товаров",
    desc: "Загрузи фото → AI меняет фон, ставит на модель, создаёт карточку для маркетплейса",
    price: "от 15₽",
    href: "/dashboard/photo-session",
    color: "from-emerald-500 to-teal-500",
    features: ["OZON / WB", "Смена фона", "Пакетная до 10"],
  },
  {
    emoji: "🤖",
    title: "Конструктор ботов",
    desc: "Создай AI-бота с базой знаний. Подключи к Telegram или встрой виджет на сайт",
    price: "бесплатно",
    href: "/dashboard/bots",
    color: "from-blue-500 to-cyan-500",
    features: ["RAG база знаний", "Telegram-бот", "Виджет на сайт"],
  },
  {
    emoji: "✍️",
    title: "AI-шаблоны",
    desc: "50+ промптов для маркетинга, SMM, SEO и бизнеса. Заполни — получи готовый текст",
    price: "от 3₽",
    href: "/dashboard/templates",
    color: "from-amber-500 to-yellow-500",
    features: ["50+ шаблонов", "6 категорий", "Выбор модели"],
  },
  {
    emoji: "🧠",
    title: "AI-Агент",
    desc: "Опиши задачу → агент разобьёт на шаги и выполнит автономно. До 10 шагов",
    price: "от 2₽",
    href: "/dashboard/agent",
    color: "from-violet-500 to-purple-600",
    features: ["3-10 шагов", "Автономный", "Контент-планы"],
  },
  {
    emoji: "🔍",
    title: "SEO-инструменты",
    desc: "Генератор статей, анализ текста, мета-теги, A/B тестирование — всё для SEO",
    price: "от 5₽",
    href: "/dashboard/seo/article",
    color: "from-green-500 to-emerald-600",
    features: ["SEO-статьи", "Анализ текста", "A/B тест"],
  },
  {
    emoji: "💬",
    title: "AI Чат",
    desc: "65+ нейросетей: GPT-5, Claude, Gemini, DeepSeek. Картинки, видео, код — бесплатно",
    price: "бесплатно",
    href: "/dashboard/chat",
    color: "from-accent to-[#D4835F]",
    features: ["10 запросов/день", "7 моделей FREE", "Файлы и голос"],
  },
];

export default function TestLandingPage() {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            15 инструментов для бизнеса
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Всё что нужно —{" "}
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              в одной AI-студии
            </span>
          </h1>
          <p className="text-text/50 mt-4 max-w-xl mx-auto text-lg">
            Реклама, контент, дизайн и автоматизация. Платите только за результат.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group bg-white rounded-2xl border border-text/[0.06] p-5 hover:border-accent/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Emoji + gradient background */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{tool.emoji}</span>
              </div>

              {/* Title + price */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-text text-[15px] leading-tight">{tool.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  tool.price === "бесплатно" ? "bg-teal/10 text-teal" : "bg-accent/10 text-accent"
                }`}>
                  {tool.price}
                </span>
              </div>

              {/* Description */}
              <p className="text-text/45 text-[12px] leading-relaxed mb-3">{tool.desc}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {tool.features.map((f) => (
                  <span key={f} className="text-[9px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded-md">{f}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </Link>
          <p className="text-text/30 text-xs mt-3">Бесплатный старт + 100₽ на баланс</p>
        </div>

      </div>
    </div>
  );
}
