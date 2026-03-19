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

        {/* Bento Grid — all cards: min-h-[180px], p-6, consistent text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* AI Chat — span 2 cols */}
          <a href="/chat" className="sm:col-span-2 bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[280px]">
            <div className="relative z-10">
              <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">
                50+ моделей
              </span>
              <h3 className="font-bold text-xl text-white mb-2">AI Чат</h3>
              <p className="text-white text-[14px] leading-relaxed max-w-xs">Общайтесь с GPT-5, Claude, Gemini и другими лучшими моделями мира</p>
            </div>
            <div className="absolute right-4 sm:right-8 top-6 w-[220px] sm:w-[280px] opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/[0.06] rounded-xl p-3 backdrop-blur-sm border border-white/[0.06]">
                <div className="flex justify-end mb-2.5">
                  <div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-2 max-w-[75%]">
                    <span className="text-white text-[10px]">Напиши код сортировки</span>
                  </div>
                </div>
                <div className="flex justify-start mb-2.5">
                  <div className="bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                    <span className="text-white/70 text-[10px]">Вот реализация быстрой сортировки на Python...</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-2 max-w-[70%]">
                    <span className="text-white text-[10px]">А теперь на Rust</span>
                  </div>
                </div>
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

          {/* Images */}
          <a href="/images" className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              6 генераторов
            </span>
            <h3 className="font-bold text-lg text-white mb-2">Генерация картинок</h3>
            <p className="text-white text-[14px] leading-relaxed">Flux, SDXL, GPT-5 Image. Фотореализм и арт-стили.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          </a>

          {/* Documents */}
          <a href="/documents" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              PDF, фото
            </span>
            <h3 className="font-bold text-lg text-white mb-2">Анализ документов</h3>
            <p className="text-white text-[14px] leading-relaxed">Загрузите PDF или фото — AI ответит на любой вопрос.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </a>

          {/* Search — with globe+magnifier icon */}
          <a href="/search" className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              Realtime
            </span>
            <h3 className="font-bold text-lg text-white mb-2">AI Поиск</h3>
            <p className="text-white text-[14px] leading-relaxed">Perplexity ищет в интернете в реальном времени. Актуальные данные, не кэш.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
          </a>

          {/* API Code Snippet */}
          <a href="/docs" className="bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden sm:col-span-2 lg:col-span-1 min-h-[180px]">
            <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              API
            </span>
            <h3 className="font-bold text-lg text-white mb-3">Простой API</h3>
            <div className="bg-white/[0.04] rounded-xl p-4 overflow-x-auto border border-white/[0.06]">
              <pre className="text-[11px] sm:text-[12px] leading-[1.7] font-mono" dangerouslySetInnerHTML={{ __html: `<span style="color:#34d399">curl</span><span style="color:rgba(255,255,255,0.5)"> -X </span><span style="color:#fcd34d">POST</span><span style="color:rgba(255,255,255,0.5)"> /api/chat \\
  -H </span><span style="color:#7dd3fc">"Authorization: Bearer $TKN"</span><span style="color:rgba(255,255,255,0.5)"> \\
  -d </span><span style="color:#7dd3fc">'{"model_id"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"gpt-4o-mini"</span><span style="color:rgba(255,255,255,0.5)">,
      </span><span style="color:#7dd3fc">"messages"</span><span style="color:rgba(255,255,255,0.5)">:[{</span><span style="color:#7dd3fc">"role"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"user"</span><span style="color:rgba(255,255,255,0.5)">,
      </span><span style="color:#7dd3fc">"content"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"Hello!"</span><span style="color:rgba(255,255,255,0.5)">}]}'</span>` }} />
            </div>
          </a>

          {/* Video */}
          <a href="/video" className="bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              5 моделей
            </span>
            <h3 className="font-bold text-lg text-white mb-2">AI Видео</h3>
            <p className="text-white text-[14px] leading-relaxed">Kling, Runway, Pika. Видео из текста и фото за 5-10 секунд.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </a>

          {/* Audio */}
          <a href="/audio" className="bg-gradient-to-br from-teal-600 to-emerald-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              10+ голосов
            </span>
            <h3 className="font-bold text-lg text-white mb-2">AI Аудио</h3>
            <p className="text-white text-[14px] leading-relaxed">Озвучка текста 10+ голосами. Голосовой ввод. Мгновенно.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
          </a>

          {/* Deep Analysis */}
          <a href="/chat" className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">
              o3 + R1
            </span>
            <h3 className="font-bold text-lg text-white mb-2">Глубокий анализ</h3>
            <p className="text-white text-[14px] leading-relaxed">o3 и DeepSeek R1 — пошаговое рассуждение для сложных задач.</p>
            <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
          </a>

        </div>
      </div>
    </section>
  );
}
