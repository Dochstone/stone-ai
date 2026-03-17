"use client";

/* ── Inline SVG illustrations ── */
function ChatSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="8" y="16" width="44" height="32" rx="8" fill="white" fillOpacity="0.2" />
      <rect x="28" y="32" width="44" height="32" rx="8" fill="white" fillOpacity="0.35" />
      <circle cx="22" cy="32" r="3" fill="white" fillOpacity="0.5" />
      <circle cx="30" cy="32" r="3" fill="white" fillOpacity="0.4" />
      <circle cx="38" cy="32" r="3" fill="white" fillOpacity="0.3" />
      <rect x="36" y="42" width="24" height="4" rx="2" fill="white" fillOpacity="0.4" />
      <rect x="36" y="50" width="16" height="4" rx="2" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

function BrushSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="14" y="14" width="52" height="52" rx="12" fill="white" fillOpacity="0.15" />
      <circle cx="32" cy="36" r="10" fill="white" fillOpacity="0.3" />
      <circle cx="48" cy="32" r="7" fill="white" fillOpacity="0.2" />
      <circle cx="40" cy="50" r="8" fill="white" fillOpacity="0.25" />
      <path d="M20 60 L36 28 L40 32 L24 64Z" fill="white" fillOpacity="0.35" />
      <rect x="16" y="58" width="14" height="6" rx="3" fill="white" fillOpacity="0.45" />
    </svg>
  );
}

function DocSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="18" y="10" width="36" height="48" rx="6" fill="white" fillOpacity="0.25" />
      <rect x="26" y="10" width="28" height="48" rx="6" fill="white" fillOpacity="0.15" />
      <rect x="26" y="22" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
      <rect x="26" y="29" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.3" />
      <rect x="26" y="36" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="26" y="43" width="12" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <circle cx="54" cy="52" r="14" fill="white" fillOpacity="0.2" />
      <path d="M54 45 L54 59 M47 52 L61 52" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="34" cy="34" r="18" stroke="white" strokeOpacity="0.35" strokeWidth="3.5" fill="white" fillOpacity="0.08" />
      <line x1="47" y1="47" x2="64" y2="64" stroke="white" strokeOpacity="0.4" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="34" cy="34" r="8" fill="white" fillOpacity="0.15" />
      <rect x="28" y="26" width="12" height="2.5" rx="1.25" fill="white" fillOpacity="0.3" />
      <rect x="28" y="32" width="8" height="2.5" rx="1.25" fill="white" fillOpacity="0.2" />
    </svg>
  );
}

function BrainSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <ellipse cx="32" cy="36" rx="16" ry="20" fill="white" fillOpacity="0.15" />
      <ellipse cx="48" cy="36" rx="16" ry="20" fill="white" fillOpacity="0.15" />
      <path d="M40 18 C36 28 36 44 40 56" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="30" cy="30" r="4" fill="white" fillOpacity="0.25" />
      <circle cx="50" cy="30" r="4" fill="white" fillOpacity="0.25" />
      <circle cx="36" cy="42" r="3" fill="white" fillOpacity="0.2" />
      <circle cx="44" cy="42" r="3" fill="white" fillOpacity="0.2" />
      <path d="M26 32 L34 28 M46 28 L54 32 M32 44 L38 40 M42 40 L48 44" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
    </svg>
  );
}

function CodeSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="10" y="14" width="60" height="44" rx="8" fill="white" fillOpacity="0.12" />
      <rect x="10" y="14" width="60" height="10" rx="8" fill="white" fillOpacity="0.08" />
      <circle cx="19" cy="19" r="2" fill="white" fillOpacity="0.35" />
      <circle cx="26" cy="19" r="2" fill="white" fillOpacity="0.25" />
      <circle cx="33" cy="19" r="2" fill="white" fillOpacity="0.15" />
      <path d="M26 36 L18 42 L26 48" stroke="white" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M46 36 L54 42 L46 48" stroke="white" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="33" y1="34" x2="39" y2="50" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const tools = [
  {
    Svg: ChatSvg,
    title: "AI Чат",
    desc: "Общайтесь с лучшими моделями: GPT-5, Claude, Gemini и другими",
    badge: "50+ моделей",
    gradient: "from-blue-600 to-indigo-700",
    href: "/chat",
  },
  {
    Svg: BrushSvg,
    title: "Генерация картинок",
    desc: "Создавайте изображения через Flux, SDXL и GPT-5 Image",
    badge: "6 генераторов",
    gradient: "from-pink-500 to-rose-600",
    href: "/images",
  },
  {
    Svg: DocSvg,
    title: "Анализ документов",
    desc: "Загрузите PDF или фото — AI ответит на любой вопрос",
    badge: "PDF, фото",
    gradient: "from-amber-500 to-orange-600",
    href: "/documents",
  },
  {
    Svg: SearchSvg,
    title: "AI Поиск",
    desc: "Поиск в интернете через Perplexity с актуальными данными",
    badge: "Realtime",
    gradient: "from-emerald-500 to-teal-600",
    href: "/search",
  },
  {
    Svg: CodeSvg,
    title: "Помощь с кодом",
    desc: "Отладка, рефакторинг и генерация кода на любом языке",
    badge: "Все языки",
    gradient: "from-slate-600 to-slate-800",
    href: "/code",
  },
  {
    Svg: BrainSvg,
    title: "Reasoning",
    desc: "Сложные задачи с пошаговым рассуждением: o3, DeepSeek R1",
    badge: "o3 + R1",
    gradient: "from-violet-600 to-purple-700",
    href: "/chat",
  },
];

export default function ToolCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Что умеет Stone AI
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Все инструменты AI в одном Telegram-боте
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              className={`relative bg-gradient-to-br ${tool.gradient} rounded-2xl p-7 pb-6 block group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden`}
            >
              {/* SVG illustration — background */}
              <div className="absolute top-0 right-0 w-28 h-28 opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
                <tool.Svg />
              </div>

              {/* Badge */}
              <div className="relative mb-4">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                  {tool.badge}
                </span>
              </div>

              <h3 className="relative font-bold text-lg text-white mb-2">{tool.title}</h3>
              <p className="relative text-white/70 text-sm leading-relaxed">{tool.desc}</p>

              {/* Arrow */}
              <div className="relative mt-4 flex items-center gap-1 text-white/50 group-hover:text-white/80 transition-colors text-xs font-semibold">
                Подробнее
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
