"use client";

export default function ToolCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Полный арсенал AI инструментов для любой задачи
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Все инструменты AI в одном месте
        </p>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* AI Chat — span 2 cols, large card with chat mockup */}
          <a href="/chat" className="sm:col-span-2 bg-[#1C1C1E] rounded-2xl p-6 sm:p-8 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[280px]">
            <div className="relative z-10">
              <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">
                50+ моделей
              </span>
              <h3 className="font-bold text-xl text-white mb-2">AI Чат</h3>
              <p className="text-white/50 text-sm max-w-xs">Общайтесь с GPT-5, Claude, Gemini и другими лучшими моделями</p>
            </div>
            {/* Mini chat mockup */}
            <div className="absolute right-4 sm:right-8 top-6 w-[220px] sm:w-[280px] opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/[0.06] rounded-xl p-3 backdrop-blur-sm border border-white/[0.06]">
                {/* User message */}
                <div className="flex justify-end mb-2.5">
                  <div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-2 max-w-[75%]">
                    <span className="text-white text-[10px]">Напиши код сортировки</span>
                  </div>
                </div>
                {/* AI message */}
                <div className="flex justify-start mb-2.5">
                  <div className="bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                    <span className="text-white/70 text-[10px]">Вот реализация быстрой сортировки на Python...</span>
                  </div>
                </div>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-2 max-w-[70%]">
                    <span className="text-white text-[10px]">А теперь на Rust</span>
                  </div>
                </div>
                {/* Input */}
                <div className="mt-2.5 bg-white/[0.05] rounded-lg flex items-center px-2.5 py-1.5 border border-white/[0.06]">
                  <span className="text-white/20 text-[9px] flex-1">Написать сообщение...</span>
                  <div className="w-4 h-4 rounded bg-accent/60 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </a>

          {/* Images — colorful card */}
          <a href="/images" className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[280px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">
              6 генераторов
            </span>
            <h3 className="font-bold text-xl text-white mb-2">Генерация картинок</h3>
            <p className="text-white/70 text-sm">Flux, SDXL, GPT-5 Image и другие</p>
            {/* Color placeholder */}
            <div className="absolute bottom-4 right-4 w-24 h-24 sm:w-32 sm:h-32 opacity-60 group-hover:opacity-80 transition-opacity">
              <div className="w-full h-full rounded-xl bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="grid grid-cols-2 gap-1 p-2 w-full h-full">
                  <div className="rounded-md bg-yellow-300/40" />
                  <div className="rounded-md bg-blue-400/40" />
                  <div className="rounded-md bg-green-400/40" />
                  <div className="rounded-md bg-purple-400/40" />
                </div>
              </div>
            </div>
          </a>

          {/* Documents — PDF icon card */}
          <a href="/documents" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">
              PDF, фото
            </span>
            <h3 className="font-bold text-lg text-white mb-2">Анализ документов</h3>
            <p className="text-white/70 text-sm">Загрузите PDF — AI ответит на любой вопрос</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </a>

          {/* Search — small */}
          <a href="/search" className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              Realtime
            </span>
            <h3 className="font-bold text-lg text-white mb-1">AI Поиск</h3>
            <p className="text-white/70 text-sm">Perplexity с актуальными данными</p>
          </a>

          {/* API Code Snippet — small, dark */}
          <a href="/docs" className="bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden sm:col-span-2 lg:col-span-1">
            <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              API
            </span>
            <h3 className="font-bold text-lg text-white mb-3">Простой API</h3>
            <pre className="bg-white/[0.04] rounded-lg p-3 overflow-x-auto border border-white/[0.06] text-[10px] sm:text-[11px] leading-relaxed">
              <code>
                <span className="text-emerald-400">curl</span>
                <span className="text-white/50"> -X POST /api/chat \</span>{"\n"}
                <span className="text-white/50">  -H </span>
                <span className="text-amber-300">&quot;Authorization: Bearer $TOKEN&quot;</span>
                <span className="text-white/50"> \</span>{"\n"}
                <span className="text-white/50">  -d </span>
                <span className="text-sky-300">{`'{"model_id":"gpt-4o-mini",`}</span>{"\n"}
                <span className="text-sky-300">{`    "messages":[{"role":"user",`}</span>{"\n"}
                <span className="text-sky-300">{`    "content":"Hello!"}]}'`}</span>
              </code>
            </pre>
          </a>

          {/* Reasoning — small */}
          <a href="/chat" className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:col-span-1">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              o3 + R1
            </span>
            <h3 className="font-bold text-lg text-white mb-1">Reasoning</h3>
            <p className="text-white/70 text-sm">Сложные задачи с пошаговым рассуждением</p>
          </a>

        </div>
      </div>
    </section>
  );
}
