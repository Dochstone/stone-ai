"use client";

const tools = [
  {
    icon: "💬",
    title: "AI Чат",
    desc: "Общайтесь с лучшими моделями: GPT-5, Claude, Gemini и другими",
    gradient: "from-blue-500/10 to-purple-500/10",
  },
  {
    icon: "🎨",
    title: "Генерация картинок",
    desc: "Создавайте изображения через Flux, SDXL и GPT-5 Image",
    gradient: "from-pink-500/10 to-orange-500/10",
  },
  {
    icon: "📄",
    title: "Анализ документов",
    desc: "Загрузите PDF и задайте вопросы по содержимому",
    gradient: "from-amber-500/10 to-yellow-500/10",
  },
  {
    icon: "🔍",
    title: "AI Поиск",
    desc: "Поиск в интернете через Perplexity с актуальными данными",
    gradient: "from-green-500/10 to-teal-500/10",
  },
  {
    icon: "💻",
    title: "Помощь с кодом",
    desc: "Отладка, рефакторинг и генерация кода на любом языке",
    gradient: "from-slate-500/10 to-blue-500/10",
  },
  {
    icon: "🧠",
    title: "Reasoning",
    desc: "Сложные задачи с пошаговым рассуждением: o3, DeepSeek R1",
    gradient: "from-violet-500/10 to-indigo-500/10",
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
            <div
              key={tool.title}
              className={`bg-gradient-to-br ${tool.gradient} rounded-2xl p-6 card-hover border border-white/60`}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-sm">
                {tool.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
              <p className="text-text/60 text-sm leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
