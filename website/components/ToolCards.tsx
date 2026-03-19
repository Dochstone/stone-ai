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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* ── AI Chat — 2 cols, chat mockup ── */}
          <a href="/chat" className="sm:col-span-2 bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[280px]" style={{ backgroundImage: "url(/demo/tool-chat.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: "soft-light" }}>
            <div className="relative z-10">
              <span className="inline-block bg-accent/20 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">50+ моделей</span>
              <h3 className="font-bold text-xl text-white mb-2">AI Чат</h3>
              <p className="text-white/80 text-[14px] leading-relaxed max-w-xs">GPT-5, Claude, Gemini и другие лучшие модели мира</p>
            </div>
            <div className="absolute right-4 sm:right-8 top-6 w-[220px] sm:w-[280px] opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
                <div className="flex justify-end mb-2"><div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-1.5"><span className="text-white text-[10px]">Напиши код сортировки</span></div></div>
                <div className="flex justify-start mb-2"><div className="bg-white/10 rounded-xl rounded-tl-sm px-3 py-1.5"><span className="text-white/60 text-[10px]">Вот быстрая сортировка на Python...</span></div></div>
                <div className="flex justify-end"><div className="bg-accent/80 rounded-xl rounded-tr-sm px-3 py-1.5"><span className="text-white text-[10px]">А теперь на Rust</span></div></div>
                <div className="mt-2 bg-white/[0.04] rounded-lg flex items-center px-2.5 py-1.5 border border-white/[0.06]">
                  <span className="text-white/20 text-[9px] flex-1">Сообщение...</span>
                  <div className="w-4 h-4 rounded bg-accent/60" />
                </div>
              </div>
            </div>
          </a>

          {/* ── Images — rose gradient with mini gallery ── */}
          <a href="/images" className="bg-gradient-to-br from-pink-500 via-rose-600 to-fuchsia-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">6 генераторов</span>
            <h3 className="font-bold text-lg text-white mb-2">Генерация картинок</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Flux, SDXL, GPT-5 Image. Фотореализм и арт-стили.</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="aspect-square rounded-lg bg-white/15 border border-white/10" />
              <div className="aspect-square rounded-lg bg-white/10 border border-white/10" />
              <div className="aspect-square rounded-lg bg-white/20 border border-white/10" />
            </div>
          </a>

          {/* ── Documents — amber gradient with PDF mockup ── */}
          <a href="/documents" className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">PDF, фото</span>
            <h3 className="font-bold text-lg text-white mb-2">Анализ документов</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Загрузите PDF или фото — AI ответит на любой вопрос.</p>
            <div className="bg-white/15 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <div>
                  <div className="text-[10px] text-white/80">report_Q4.pdf</div>
                  <div className="text-[9px] text-white/50">2.4 MB · 48 стр</div>
                </div>
              </div>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-white/30" />)}
                <div className="h-1 flex-[2] rounded-full bg-white/10" />
              </div>
            </div>
          </a>

          {/* ── Search — emerald gradient with search mockup ── */}
          <a href="/search" className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">Realtime</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Поиск</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Perplexity ищет в интернете. Актуальные данные, не кэш.</p>
            <div className="bg-white/15 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <span className="text-[10px] text-white/70">курс биткоина сегодня</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded bg-white/25" />
                <div className="h-1.5 w-4/5 rounded bg-white/15" />
                <div className="h-1.5 w-3/5 rounded bg-white/10" />
              </div>
            </div>
          </a>

          {/* ── API — dark slate with code snippet ── */}
          <a href="/docs" className="bg-gradient-to-br from-slate-600 via-slate-700 to-zinc-900 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden sm:col-span-2 lg:col-span-1 min-h-[180px]">
            <span className="inline-block bg-sky-400/20 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">API</span>
            <h3 className="font-bold text-lg text-white mb-3">Простой API</h3>
            <div className="bg-white/[0.04] rounded-xl p-3 overflow-x-auto border border-white/[0.06]">
              <pre className="text-[11px] leading-[1.7] font-mono" dangerouslySetInnerHTML={{ __html: `<span style="color:#34d399">curl</span><span style="color:rgba(255,255,255,0.5)"> -X </span><span style="color:#fcd34d">POST</span><span style="color:rgba(255,255,255,0.5)"> /api/chat \\
  -H </span><span style="color:#7dd3fc">"Bearer $TKN"</span><span style="color:rgba(255,255,255,0.5)"> \\
  -d </span><span style="color:#7dd3fc">'{"model_id"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"gpt-4o-mini"</span><span style="color:rgba(255,255,255,0.5)">,
      </span><span style="color:#7dd3fc">"messages"</span><span style="color:rgba(255,255,255,0.5)">:[...]}'</span>` }} />
            </div>
          </a>

          {/* ── Video — red gradient with video player mockup ── */}
          <a href="/video" className="bg-gradient-to-br from-red-500 via-rose-600 to-pink-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">5 моделей</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Видео</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Kling, Runway, Pika. Видео из текста за 5-10 секунд.</p>
            <div className="bg-white/15 rounded-xl overflow-hidden border border-white/10">
              <div className="aspect-video bg-white/5 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="h-1 flex-1 rounded-full bg-white/30" />
                <span className="text-[9px] text-white/25">0:08</span>
              </div>
            </div>
          </a>

          {/* ── Audio — indigo gradient with audio player mockup ── */}
          <a href="/audio" className="bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">10+ голосов</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Аудио</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Озвучка текста 10+ голосами. Голосовой ввод. Мгновенно.</p>
            <div className="bg-white/15 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="flex items-end gap-[3px] h-5 flex-1">
                  {[3,5,8,4,7,9,6,4,7,5,8,3,6,9,5,7,4,8,6,3,5,7,4,6,8,5,3].map((h, i) => (
                    <div key={i} className="flex-1 rounded-full bg-white/30" style={{ height: `${h * 2.2}px` }} />
                  ))}
                </div>
                <span className="text-[10px] text-white/30 shrink-0">0:12</span>
              </div>
              <div className="flex gap-1.5">
                {["Nova", "Echo", "Alloy"].map((v, i) => (
                  <span key={v} className={`text-[9px] px-2 py-0.5 rounded-md ${i === 0 ? "bg-white/25 text-white" : "bg-white/10 text-white/50"}`}>{v}</span>
                ))}
              </div>
            </div>
          </a>

          {/* ── Deep Analysis — cyan-to-slate gradient with reasoning mockup ── */}
          <a href="/chat" className="bg-gradient-to-br from-cyan-600 via-blue-700 to-slate-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">o3 + R1</span>
            <h3 className="font-bold text-lg text-white mb-2">Глубокий анализ</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Пошаговое рассуждение для сложных задач.</p>
            <div className="bg-white/15 rounded-xl p-3 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                <span className="text-[10px] text-white/70">Анализирую условие задачи...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                <span className="text-[10px] text-white/70">Рассматриваю 3 подхода...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30" />
                <span className="text-[10px] text-white/40">Формулирую ответ...</span>
              </div>
            </div>
          </a>

        </div>
      </div>
    </section>
  );
}
