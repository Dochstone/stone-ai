"use client";

import { useState, useEffect } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";

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
            <p className="text-sm text-text/60"><span className="font-bold text-text">65+ нейросетей</span> от 590₽/мес</p>
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
            <img src="/mascots/stone-mascot-idle.webp" alt="Stone AI маскот" width="32" height="32" />
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

        {/* Links grid — 5 even columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Инструменты</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/chat" className="hover:text-text transition-colors">AI Чат</a></li>
              <li><a href="/images" className="hover:text-text transition-colors">Картинки</a></li>
              <li><a href="/video" className="hover:text-text transition-colors">Видео</a></li>
              <li><a href="/code" className="hover:text-text transition-colors">Код</a></li>
              <li><a href="/search" className="hover:text-text transition-colors">AI Поиск</a></li>
              <li><a href="/translate" className="hover:text-text transition-colors">Переводчик</a></li>
              <li><a href="/documents" className="hover:text-text transition-colors">Документы</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Сравнения</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/compare/gpt-5-vs-claude-opus-4" className="hover:text-text transition-colors">GPT-5 vs Claude Opus</a></li>
              <li><a href="/compare/gpt-5-vs-gemini-3-pro" className="hover:text-text transition-colors">GPT-5 vs Gemini 3</a></li>
              <li><a href="/compare/gpt-4o-mini-vs-claude-haiku" className="hover:text-text transition-colors">GPT-4o vs Haiku</a></li>
              <li><a href="/compare/stone-ai-vs-chatgpt-plus" className="hover:text-text transition-colors">Stone AI vs ChatGPT</a></li>
              <li><a href="/alternatives/chatgpt" className="hover:text-text transition-colors">Альтернативы ChatGPT</a></li>
              <li><a href="/alternatives/midjourney" className="hover:text-text transition-colors">Альтернативы Midjourney</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">AI по задачам</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/for/marketer" className="hover:text-text transition-colors">Для маркетолога</a></li>
              <li><a href="/for/developer" className="hover:text-text transition-colors">Для программиста</a></li>
              <li><a href="/for/copywriter" className="hover:text-text transition-colors">Для копирайтера</a></li>
              <li><a href="/for/designer" className="hover:text-text transition-colors">Для дизайнера</a></li>
              <li><a href="/for/student" className="hover:text-text transition-colors">Для студента</a></li>
              <li><a href="/tools/image-generation" className="hover:text-text transition-colors">Генерация картинок</a></li>
              <li><a href="/tools/video-generation" className="hover:text-text transition-colors">Генерация видео</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Навигация</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/models" className="hover:text-text transition-colors">Каталог моделей</a></li>
              <li><a href="/pricing" className="hover:text-text transition-colors">Тарифы</a></li>
              <li><a href="/blog" className="hover:text-text transition-colors">Блог</a></li>
              <li><a href="/referral" className="hover:text-text transition-colors">Рефералы</a></li>
              <li><a href="/docs" className="hover:text-text transition-colors">API Docs</a></li>
              <li><a href="/about" className="hover:text-text transition-colors">О нас</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text/30 mb-4">Правовая информация</h4>
            <ul className="space-y-2.5 text-[13px] text-text/50">
              <li><a href="/terms" className="hover:text-text transition-colors">Оферта</a></li>
              <li><a href="/privacy" className="hover:text-text transition-colors">Конфиденциальность</a></li>
              <li><a href="/refund" className="hover:text-text transition-colors">Возврат средств</a></li>
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
