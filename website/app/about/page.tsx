import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О Stone AI — команда, миссия, технологии",
  description:
    "Stone AI — российская платформа доступа к 65+ нейросетям. Узнайте о нашей команде, миссии и технологиях. Работаем с 2025 года.",
  alternates: { canonical: "/about" },
};

const stats = [
  { value: "65+", label: "AI-моделей", desc: "от 15 мировых компаний" },
  { value: "15+", label: "инструментов", desc: "чат, боты, агент, презентации, SEO..." },
  { value: "4", label: "способа оплаты", desc: "Карта РФ, СБП, крипто, TON" },
  { value: "24/7", label: "доступность", desc: "без VPN, в любой стране" },
];

const values = [
  {
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    title: "Доступность",
    desc: "AI должен быть доступен каждому — с оплатой в рублях, без VPN. AI-студия нового поколения. 65+ нейросетей, 15 инструментов — от рекламы до видео.",
  },
  {
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Прозрачные цены",
    desc: "4 тарифа: Free (15 запросов/день), Start (390₽), Pro (890₽), Elite (1990₽). Pay-per-use для инструментов. Никаких скрытых комиссий.",
  },
  {
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    title: "Безопасность",
    desc: "Stone AI не хранит содержимое запросов. Данные передаются напрямую провайдерам по зашифрованному каналу. Платежи через сертифицированного партнёра Platega.",
  },
  {
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    title: "Всё в одном месте",
    desc: "AI-чат, конструктор ботов с базой знаний, AI-агент, генератор рекламных кампаний, презентации, фотосессия товаров, SEO-модуль, A/B тесты — одна платформа.",
  },
];

const timeline = [
  { year: "2025 Q3", event: "Запуск Stone AI как Telegram-бота с 10 AI-моделями" },
  { year: "2025 Q4", event: "Генерация картинок, подписки, 3 способа оплаты, 30 моделей" },
  { year: "2026 Q1", event: "65+ нейросетей. Видео, 3D, аудио. Веб-чат stoneai.ru. API для разработчиков" },
  { year: "2026 Q2", event: "Панель инструментов: AI-шаблоны, презентации, фотосессия, SEO, галерея, достижения" },
  { year: "2026 Q2", event: "Platega (карты РФ, СБП). Конструктор ботов + RAG. AI-агент. Рекламные кампании" },
  { year: "2026 Q2", event: "Виджет для сайтов, Telegram-бот подключение, WordPress интеграция, A/B тесты" },
];

const techStack = [
  { name: "OpenAI", models: "GPT-5.1, GPT-4o mini, GPT Image, o3" },
  { name: "Anthropic", models: "Claude Opus 4.5, Sonnet 4, Haiku 4.5" },
  { name: "Google", models: "Gemini 2.5 Pro, Gemini 2.0 Flash" },
  { name: "Meta", models: "Llama 4 Maverick" },
  { name: "xAI", models: "Grok 3, Grok 3 Mini" },
  { name: "DeepSeek", models: "R1, V3, V3.2" },
  { name: "Mistral", models: "Mistral Large, Devstral" },
  { name: "Perplexity", models: "Sonar, Sonar Pro, Deep Research" },
];

const tools = [
  { icon: "💬", name: "AI Чат", desc: "AI-студия нового поколения" },
  { icon: "🤖", name: "Конструктор ботов", desc: "Бот с базой знаний (RAG)" },
  { icon: "🧠", name: "AI-Агент", desc: "Автономные multi-step задачи" },
  { icon: "📊", name: "Рекламные кампании", desc: "Яндекс Директ за 3 минуты" },
  { icon: "📝", name: "AI-шаблоны", desc: "50+ готовых промптов" },
  { icon: "📷", name: "Фотосессия товаров", desc: "Смена фона, на модели, пакетная" },
  { icon: "🎬", name: "Презентации", desc: "Слайды + PPTX экспорт" },
  { icon: "🔍", name: "SEO-модуль", desc: "Статьи, мета-теги, A/B тесты" },
  { icon: "🌐", name: "Виджет для сайта", desc: "Встраиваемый чат-бот" },
  { icon: "📱", name: "Telegram-боты", desc: "Подключение через BotFather" },
  { icon: "📈", name: "Аналитика", desc: "Отслеживание посещений" },
  { icon: "🏆", name: "Геймификация", desc: "Достижения, игры, лидерборд" },
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
            Все нейросети мира
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              в одном окне
            </span>
          </h1>
          <p className="text-text/60 text-lg max-w-2xl mx-auto leading-relaxed">
            STONE AI — Smart Technology Omniscient Neural Engine — платформа, которая объединяет
            65+ нейросетей и 15+ инструментов для бизнеса в одном интерфейсе. Без VPN, с оплатой в рублях.
          </p>
          <div className="mt-6">
            <img src="/mascots/stone-mascot-idle.webp" alt="Stone AI маскот" width="120" height="120" className="mx-auto" />
          </div>
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

        {/* Tools grid */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">Что умеет Stone AI</h2>
          <p className="text-text/50 text-center mb-10 max-w-lg mx-auto">Не просто чат — полноценная AI-платформа для работы и бизнеса</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tools.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-text/5 p-4 hover:border-accent/20 transition-colors">
                <span className="text-2xl block mb-2">{t.icon}</span>
                <div className="font-bold text-sm mb-0.5">{t.name}</div>
                <div className="text-text/40 text-[11px]">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

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
                <div className="shrink-0 w-20 text-right">
                  <span className="text-xs font-bold text-accent">{t.year}</span>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[4px] top-4 w-0.5 h-full bg-text/10" />
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
            Модели напрямую от ведущих AI-компаний мира
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techStack.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-text/5 p-4 hover:border-accent/20 transition-colors">
                <div className="font-bold text-sm mb-1">{t.name}</div>
                <div className="text-text/40 text-xs">{t.models}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-r from-accent/10 to-teal/10 rounded-2xl border border-accent/10 p-8 md:p-12 text-center">
          <img src="/mascots/stone-mascot-chat.webp" alt="Stone" width="80" height="80" className="mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-4">Связаться с нами</h2>
          <p className="text-text/50 text-sm mb-8 max-w-md mx-auto">
            Вопросы, предложения, сотрудничество, баг-репорты
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer"
              className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-colors">
              Написать в поддержку
            </a>
            <a href="mailto:dochstone@gmail.com"
              className="border-2 border-text/15 text-text px-8 py-3.5 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors">
              Email
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
