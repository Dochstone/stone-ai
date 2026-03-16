import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оферта — Stone AI",
};

export default function TermsPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold mb-2">Публичная оферта</h1>
        <p className="text-text/40 text-sm mb-10">Дата последнего обновления: 16 марта 2026 г.</p>

        <div className="space-y-8 text-sm text-text/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text mb-3">1. Общие положения</h2>
            <p>
              Настоящая публичная оферта (далее — «Оферта») определяет условия использования сервиса Stone AI
              (далее — «Сервис»), доступного через Telegram-бота @StoneAIBot. Оферта адресована неограниченному кругу лиц
              и является официальным предложением заключить договор на оказание услуг.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">2. Предмет оферты</h2>
            <p>
              Сервис предоставляет доступ к AI-моделям (языковые модели, модели генерации изображений и поиска)
              через интерфейс Telegram Mini App. Услуга оказывается на условиях оплаты за использованные токены (per-token billing).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">3. Стоимость и порядок оплаты</h2>
            <p>
              Стоимость использования каждой модели указана в разделе «Цены» в приложении. Списание средств
              происходит после обработки каждого запроса на основании фактически использованных токенов.
              Пополнение баланса осуществляется через Telegram Stars, банковские карты, СБП или криптовалюту (USDT, BTC, ETH).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">4. Бесплатный доступ</h2>
            <p>
              Сервис предоставляет бесплатный доступ к 5 моделям с лимитом 10 запросов в день.
              Дополнительные 5 запросов доступны за просмотр рекламного материала.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">5. Ограничение ответственности</h2>
            <p>
              Сервис предоставляется «как есть» (as is). Администрация не несёт ответственности за содержание
              ответов AI-моделей, их точность и полноту. Пользователь самостоятельно оценивает применимость
              полученной информации. AI-модели предоставляются через сторонних провайдеров (OpenAI, Anthropic, Google и др.),
              и их работа зависит от доступности этих сервисов.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">6. Запрещённое использование</h2>
            <p>
              Запрещается использование Сервиса для генерации незаконного контента, спама, вредоносного ПО,
              а также для любых целей, нарушающих законодательство РФ или условия использования
              провайдеров AI-моделей.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">7. Изменение условий</h2>
            <p>
              Администрация оставляет за собой право изменять условия настоящей Оферты с уведомлением
              пользователей через Telegram-бота. Продолжение использования Сервиса после изменений
              означает согласие с новыми условиями.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">8. Контакты</h2>
            <p>
              По всем вопросам обращайтесь в поддержку:{" "}
              <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                @StoneAIsupport
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
