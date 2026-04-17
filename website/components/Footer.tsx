"use client";

import { useState, useEffect } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";
import { planPriceFull } from "@/lib/pricing";

export default function Footer() {
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stone_auth");
      if (!raw) return;
      const auth = JSON.parse(raw);
      if (auth?.plan && auth.plan !== "free") setHasPaidPlan(true);
    } catch {}
  }, []);

  return (
    <footer className="bg-bg border-t border-text/5">
      {/* Pricing CTA */}
      {!hasPaidPlan && (
        <div className="bg-accent/5 border-b border-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-text/60"><span className="font-bold text-text">65+ нейросетей</span> от {planPriceFull("mini")}</p>
            <a href="/pricing" className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
              Выбрать тариф
            </a>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-text/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/mascots/stone-mascot-idle.webp" alt="Stone AI маскот" width="32" height="32" loading="lazy" />
            <div>
              <h3 className="text-lg font-extrabold leading-none">Stone AI</h3>
              <p className="text-[9px] text-text/25 tracking-[0.1em] uppercase mt-0.5">AI-студия нового поколения</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard/chat" className="text-sm font-semibold text-accent hover:underline">Веб-чат &rarr;</a>
            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-text/40 hover:text-text/60">Telegram &rarr;</a>
            <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-text/40 hover:text-text/60">Поддержка</a>
          </div>
        </div>

        {/* Links grid — 5 even columns with H4 hierarchy */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Нейросети</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/models" className="hover:text-text transition-colors">Каталог 65+ моделей</a></li>
              <li><a href="/tools/image-generation" className="hover:text-text transition-colors">Генерация картинок</a></li>
              <li><a href="/tools/video-generation" className="hover:text-text transition-colors">Генерация видео</a></li>
              <li><a href="/tools/text-generation" className="hover:text-text transition-colors">Генерация текста</a></li>
              <li><a href="/tools/code-generation" className="hover:text-text transition-colors">Генерация кода</a></li>
              <li><a href="/compare" className="hover:text-text transition-colors">Сравнение моделей</a></li>
              <li><a href="/hub/image-ai" className="hover:text-text transition-colors">Pillar: AI для картинок</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Альтернативы</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/alternatives/chatgpt" className="hover:text-text transition-colors">Альтернативы ChatGPT</a></li>
              <li><a href="/alternatives/claude" className="hover:text-text transition-colors">Альтернативы Claude</a></li>
              <li><a href="/alternatives/midjourney" className="hover:text-text transition-colors">Альтернативы Midjourney</a></li>
              <li><a href="/alternatives/sora" className="hover:text-text transition-colors">Альтернативы Sora</a></li>
              <li><a href="/alternatives/perplexity" className="hover:text-text transition-colors">Альтернативы Perplexity</a></li>
              <li><a href="/compare/gpt-5-vs-claude-opus-4" className="hover:text-text transition-colors">GPT-5 vs Claude Opus</a></li>
              <li><a href="/compare/stone-ai-vs-chatgpt-plus" className="hover:text-text transition-colors">Stone AI vs ChatGPT</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Решения</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/for/marketer" className="hover:text-text transition-colors">Для маркетолога</a></li>
              <li><a href="/for/smm" className="hover:text-text transition-colors">Для SMM</a></li>
              <li><a href="/for/copywriter" className="hover:text-text transition-colors">Для копирайтера</a></li>
              <li><a href="/for/developer" className="hover:text-text transition-colors">Для программиста</a></li>
              <li><a href="/for/designer" className="hover:text-text transition-colors">Для дизайнера</a></li>
              <li><a href="/for/business" className="hover:text-text transition-colors">Для бизнеса</a></li>
              <li><a href="/for/student" className="hover:text-text transition-colors">Для студента</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Компания</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/about" className="hover:text-text transition-colors">О Stone AI</a></li>
              <li><a href="/pricing" className="hover:text-text transition-colors">Тарифы</a></li>
              <li><a href="/blog" className="hover:text-text transition-colors">Блог</a></li>
              <li><a href="/authors" className="hover:text-text transition-colors">Авторы блога</a></li>
              <li><a href="/referral" className="hover:text-text transition-colors">Рефералы</a></li>
              <li><a href="/docs" className="hover:text-text transition-colors">API Docs</a></li>
              <li><a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">Поддержка</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Правовая</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/terms" className="hover:text-text transition-colors">Публичная оферта</a></li>
              <li><a href="/privacy" className="hover:text-text transition-colors">Конфиденциальность</a></li>
              <li><a href="/refund" className="hover:text-text transition-colors">Возврат средств</a></li>
              <li><a href="/llms.txt" className="hover:text-text transition-colors" target="_blank" rel="noopener">llms.txt</a></li>
              <li><a href="/sitemap.xml" className="hover:text-text transition-colors" target="_blank" rel="noopener">Sitemap</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-text/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text/25">
          <span>&copy; 2026 Stone AI. Все права защищены.</span>
          <span>Сделано в России</span>
        </div>
      </div>
    </footer>
  );
}
