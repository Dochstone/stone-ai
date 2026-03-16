import { TELEGRAM_BOT_URL } from "@/lib/models";

const steps = [
  {
    num: "01",
    title: "Откройте бота",
    desc: "Нажмите кнопку ниже или найдите @StoneAIBot в Telegram. Никакой регистрации.",
  },
  {
    num: "02",
    title: "Выберите модель",
    desc: "50+ моделей: от бесплатных GPT-4o mini и Claude Haiku до мощных GPT-5 и Claude Opus.",
  },
  {
    num: "03",
    title: "Пишите и платите за токены",
    desc: "10 бесплатных запросов в день. Для безлимита пополните баланс — платите только за использованное.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Как начать
        </h2>
        <p className="text-text/60 text-center mb-14 max-w-lg mx-auto">
          Три шага — и вы общаетесь с лучшими AI-моделями мира
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent font-extrabold text-lg mb-5">
                {step.num}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-text/60 text-sm leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Начать бесплатно
          </a>
        </div>
      </div>
    </section>
  );
}
