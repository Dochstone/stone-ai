export default function ProductScreenshot() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-text mb-3">AI-студия нового поколения</h2>
          <p className="text-text/50 max-w-lg mx-auto">Панель инструментов и AI-чат — без переключений между сервисами</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mockup 1 — Dashboard Panel */}
          <div className="group rounded-2xl overflow-hidden border border-text/[0.08] bg-bg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.06)" }}>
            <a href="/dashboard" className="h-8 bg-text/[0.03] border-b border-text/[0.06] flex items-center px-3 gap-1.5 hover:bg-text/[0.05] transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              <span className="text-[9px] text-text/25 ml-2">stoneai.ru/dashboard</span>
            </a>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75h2.25A2.25 2.25 0 0121 6v2.25a2.25 2.25 0 01-2.25 2.25H16.5a2.25 2.25 0 01-2.25-2.25V6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Панель инструментов</h3>
                  <p className="text-[10px] text-text/35">15 AI-инструментов</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: "💬", name: "AI Чат",       href: "/dashboard/chat",          badge: null },
                  { icon: "📝", name: "Шаблоны",      href: "/dashboard/templates",     badge: "50+" },
                  { icon: "🤖", name: "Мои боты",     href: "/dashboard/bots",          badge: "NEW" },
                  { icon: "🎨", name: "Галерея",      href: "/dashboard/gallery",       badge: null },
                  { icon: "📊", name: "Презентации",  href: "/dashboard/presentations", badge: null },
                  { icon: "📷", name: "Фотосессия",   href: "/dashboard/photo-session", badge: null },
                  { icon: "🔍", name: "SEO",          href: "/dashboard/seo",           badge: null },
                  { icon: "🧠", name: "AI-Агент",     href: "/dashboard/agent",         badge: "NEW" },
                  { icon: "🏆", name: "Достижения",   href: "/dashboard/achievements",  badge: null },
                ].map((t) => (
                  <a
                    key={t.name}
                    href={t.href}
                    className="bg-text/[0.03] rounded-xl p-3 text-center hover:bg-accent/5 hover:shadow-sm transition-all block focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <span className="text-lg block mb-1">{t.icon}</span>
                    <span className="text-[10px] font-semibold text-text/60 block">{t.name}</span>
                    {t.badge && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${t.badge === "NEW" ? "bg-accent/10 text-accent" : "bg-text/[0.06] text-text/30"}`}>{t.badge}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Mockup 2 — AI Chat */}
          <a href="/dashboard/chat" className="group rounded-2xl overflow-hidden border border-text/[0.08] bg-bg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1 block" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.06)" }}>
            <div className="h-8 bg-text/[0.03] border-b border-text/[0.06] flex items-center px-3 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              <span className="text-[9px] text-text/25 ml-2">stoneai.ru/dashboard/chat</span>
            </div>
            {/* Top bar */}
            <div className="h-10 border-b border-text/[0.06] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#10a37f] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">G</span>
                </div>
                <span className="text-[11px] font-bold text-text">GPT-4o mini</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal">FREE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text/30">552</span>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white">Elite</span>
              </div>
            </div>
            {/* Messages */}
            <div className="px-4 py-4 space-y-3" style={{ minHeight: 260 }}>
              {/* User */}
              <div className="flex gap-2 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-accent ring-1 ring-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-white">DO</span>
                </div>
                <div className="bg-gradient-to-br from-accent/90 to-accent text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] max-w-[75%] shadow-sm">
                  Сравни Claude Sonnet 4 и GPT-5.1 для рефакторинга кода
                </div>
              </div>
              {/* AI */}
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#10a37f] ring-1 ring-text/[0.06] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="bg-text/[0.04] text-text/80 rounded-2xl rounded-tl-sm px-3 py-2.5 text-[11px] max-w-[80%] leading-relaxed">
                  <p className="font-semibold mb-1.5">Отличный вопрос! Вот ключевые различия:</p>
                  <p className="mb-1"><span className="font-semibold text-[#d97706]">Claude Sonnet 4</span> — лучше для архитектурного рефакторинга, следует SOLID, чище типизация</p>
                  <p><span className="font-semibold text-[#10a37f]">GPT-5.1</span> — быстрее находит баги, лучше для дебага и быстрых фиксов</p>
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-text/25">
                    <span>245 tok</span>
                    <span>·</span>
                    <span>0.3₽</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Input */}
            <div className="border-t border-text/[0.06] px-4 py-2">
              <div className="flex items-center gap-2 bg-text/[0.03] border border-text/[0.08] rounded-2xl px-3 py-2">
                <svg className="w-4 h-4 text-text/15 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32" />
                </svg>
                <span className="text-[10px] text-text/60 font-medium">GPT-4o mini</span>
                <span className="flex-1 text-[11px] text-text/20">Сообщение...</span>
                <svg className="w-4 h-4 text-text/15 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
