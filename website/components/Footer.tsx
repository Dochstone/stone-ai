import { TELEGRAM_BOT_URL } from "@/lib/models";

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-text/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-extrabold mb-3">Stone AI</h3>
            <p className="text-text/50 text-sm leading-relaxed max-w-sm">
              50 AI-моделей без VPN, прямо в Telegram. GPT-5, Claude Opus, Gemini Pro
              и другие. Платите только за использованные токены.
            </p>
            <div className="mt-4">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent text-sm font-semibold hover:underline"
              >
                Telegram-бот &rarr;
              </a>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Навигация</h4>
            <ul className="space-y-2 text-sm text-text/50">
              <li>
                <a href="/models" className="hover:text-text transition-colors">Модели</a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-text transition-colors">Цены</a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-text transition-colors">FAQ</a>
              </li>
              <li>
                <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">
                  Поддержка
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Юридическое</h4>
            <ul className="space-y-2 text-sm text-text/50">
              <li>
                <a href="/terms" className="hover:text-text transition-colors">Оферта</a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-text transition-colors">Конфиденциальность</a>
              </li>
              <li>
                <a href="/refund" className="hover:text-text transition-colors">Возврат средств</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-text/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-text/30">
          <span>&copy; 2026 Stone AI. Все права защищены.</span>
          <span>Сделано в России</span>
        </div>
      </div>
    </footer>
  );
}
