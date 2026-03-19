export default function ProductScreenshot() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mockup frame */}
        <div
          className="rounded-2xl overflow-hidden border border-text/[0.08] bg-white"
          style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.08)" }}
        >
          <div className="flex h-[400px] sm:h-[480px]">
            {/* Sidebar */}
            <div className="w-[200px] sm:w-[240px] bg-[#F5F4F0] border-r border-text/[0.06] flex-col hidden sm:flex">
              {/* New chat btn */}
              <div className="p-3">
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-text/[0.06]">
                  <svg className="w-3.5 h-3.5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[12px] font-semibold text-text/60">Новый чат</span>
                </div>
              </div>
              {/* Chat items */}
              <div className="flex-1 px-2 space-y-0.5">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-[11px] font-medium text-text truncate">Код на Python</div>
                  <div className="text-[9px] text-text/25 mt-0.5">GPT-4o mini</div>
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-white/50">
                  <div className="text-[11px] font-medium text-text/60 truncate">Анализ отчёта Q4</div>
                  <div className="text-[9px] text-text/20 mt-0.5">Claude Opus 4</div>
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-white/50">
                  <div className="text-[11px] font-medium text-text/60 truncate">Логотип для стартапа</div>
                  <div className="text-[9px] text-text/20 mt-0.5">Flux Schnell</div>
                </div>
              </div>
              {/* Model selector */}
              <div className="p-3 border-t border-text/[0.06]">
                <div className="text-[9px] font-semibold text-text/25 uppercase tracking-wider mb-1">Модель</div>
                <div className="bg-white border border-text/[0.06] rounded-lg px-3 py-2 text-[11px] font-medium text-text">
                  GPT-4o mini — OpenAI
                </div>
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top bar */}
              <div className="h-11 border-b border-text/[0.06] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#10a37f] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">G</span>
                  </div>
                  <span className="text-[12px] font-bold text-text">GPT-4o mini</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-light text-teal">FREE</span>
                </div>
                <span className="text-[11px] font-bold text-accent">$12.50</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4 space-y-4">
                {/* User */}
                <div className="flex gap-2 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">U</span>
                  </div>
                  <div className="bg-accent text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] max-w-[70%]">
                    Напиши функцию быстрой сортировки на Python
                  </div>
                </div>
                {/* AI */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#10a37f] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">G</span>
                  </div>
                  <div className="bg-[#F0EFEB] text-text/80 rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[75%]">
                    <p className="mb-1.5">Вот реализация quicksort:</p>
                    <div className="bg-[#1C1C1E] rounded-lg p-2.5 text-[10px] font-mono text-white/80 leading-relaxed">
                      <span className="text-purple-400">def</span> <span className="text-blue-400">quicksort</span>(arr):<br/>
                      &nbsp;&nbsp;<span className="text-purple-400">if</span> <span className="text-blue-400">len</span>(arr) {"<="} <span className="text-amber-300">1</span>:<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> arr<br/>
                      &nbsp;&nbsp;pivot = arr[<span className="text-amber-300">0</span>]<br/>
                      &nbsp;&nbsp;<span className="text-purple-400">return</span> quicksort([x ...])
                    </div>
                    <div className="mt-1.5 text-[9px] text-text/30">128 tok · $0.0003</div>
                  </div>
                </div>
                {/* User */}
                <div className="flex gap-2 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">U</span>
                  </div>
                  <div className="bg-accent text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] max-w-[70%]">
                    Теперь добавь type hints
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-text/[0.06] px-4 sm:px-6 py-2.5 shrink-0">
                <div className="flex items-center gap-2 bg-bg border border-text/[0.06] rounded-xl px-3 py-2">
                  <svg className="w-4 h-4 text-text/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  <span className="flex-1 text-[11px] text-text/20">Написать сообщение...</span>
                  <div className="w-6 h-6 rounded-lg bg-accent/30 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
