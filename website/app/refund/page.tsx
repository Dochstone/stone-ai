import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возврат средств — Stone AI",
};

export default function RefundPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold mb-2">Политика возврата средств</h1>
        <p className="text-text/40 text-sm mb-10">Дата последнего обновления: 16 марта 2026 г.</p>

        <div className="space-y-8 text-sm text-text/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text mb-3">1. Общие условия</h2>
            <p>
              Stone AI предоставляет услуги на условиях предоплаты. Средства зачисляются на внутренний баланс
              и списываются по мере использования AI-моделей на основе фактически использованных токенов.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">2. Когда возврат возможен</h2>
            <p className="mb-2">Возврат неиспользованных средств возможен в следующих случаях:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Техническая ошибка при зачислении (двойное списание, неверная сумма)</li>
              <li>Невозможность использования сервиса по техническим причинам на стороне Stone AI в течение более 72 часов</li>
              <li>Неиспользованный баланс при закрытии аккаунта (если с момента пополнения прошло менее 30 дней)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">3. Как запросить возврат</h2>
            <p>
              Для запроса возврата напишите в поддержку:{" "}
              <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                @StoneAIsupport
              </a>{" "}
              с указанием суммы, даты платежа и причины возврата. Мы рассмотрим запрос в течение 5 рабочих дней.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">4. Сроки возврата</h2>
            <p>
              Возврат осуществляется тем же способом, которым была произведена оплата, в течение
              10 рабочих дней с момента одобрения запроса. Для Telegram Stars возврат производится
              в соответствии с политикой Telegram.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">5. Когда возврат невозможен</h2>
            <p className="mb-2">Возврат не осуществляется:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>За уже использованные токены (обработанные запросы)</li>
              <li>Если с момента пополнения прошло более 30 дней</li>
              <li>При нарушении условий использования сервиса</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
