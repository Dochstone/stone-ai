import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Stone AI",
};

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold mb-2">Политика конфиденциальности</h1>
        <p className="text-text/40 text-sm mb-10">Дата последнего обновления: 16 марта 2026 г.</p>

        <div className="space-y-8 text-sm text-text/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text mb-3">1. Какие данные мы собираем</h2>
            <p>
              При использовании Stone AI мы получаем ваш Telegram ID, имя пользователя и язык интерфейса.
              Мы не запрашиваем email, номер телефона или другие персональные данные.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">2. Как мы используем данные</h2>
            <p className="mb-2">Данные используются исключительно для:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Идентификации пользователя в системе</li>
              <li>Ведения баланса и истории транзакций</li>
              <li>Учёта использования сервиса (количество запросов, токенов)</li>
              <li>Улучшения качества сервиса</li>
            </ul>
            <p className="mt-2">
              Мы не передаём ваши данные третьим лицам в маркетинговых целях.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">3. Хранение сообщений</h2>
            <p>
              Тексты ваших запросов к AI-моделям передаются провайдерам моделей (OpenAI, Anthropic, Google и др.)
              для обработки. Мы не храним содержимое ваших диалогов на наших серверах дольше,
              чем необходимо для обработки запроса. История чатов хранится локально на вашем устройстве.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">4. Платёжные данные</h2>
            <p>
              Оплата обрабатывается через сторонние платёжные системы: Telegram Stars, Lava.ru (карты, СБП), Heleket (криптовалюта).
              Мы не храним данные банковских карт. Вся платёжная информация обрабатывается
              непосредственно платёжными провайдерами.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">5. Безопасность</h2>
            <p>
              Мы применяем стандартные меры защиты данных: шифрование при передаче (TLS),
              ограничение доступа к базам данных, регулярное обновление ПО.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text mb-3">6. Ваши права</h2>
            <p>
              Вы можете запросить удаление ваших данных, обратившись в поддержку:{" "}
              <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                @StoneAIsupport
              </a>
              . Мы удалим ваши данные в течение 30 дней.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
