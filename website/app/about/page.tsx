import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Callout from "@/components/content/Callout";
import Quote from "@/components/content/Quote";
import StatBlock from "@/components/content/StatBlock";
import FaqExtended from "@/components/content/FaqExtended";
import { planPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "О Stone AI — команда, миссия, технологии",
  description:
    "Stone AI — российская платформа-агрегатор для работы с 65+ нейросетями в одном интерфейсе. 15 305 активных пользователей, оплата в рублях, без VPN. История, команда, принципы работы, цифры.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "О Stone AI — команда, миссия, технологии",
    description:
      "Stone AI — российская платформа доступа к 65+ нейросетям. История с 2024 года, команда, цифры платформы, принципы работы.",
  },
};

const values = [
  {
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    title: "Доступность",
    desc: "AI должен быть доступен каждому — с оплатой в рублях, без VPN, без иностранных карт и посредников с комиссиями. Мы берём на себя всю техническую инфраструктуру — API-ключи зарубежных провайдеров, платёжную интеграцию, юрлицо в стране с прямым доступом к OpenAI и Anthropic. Пользователь просто пользуется AI как электричеством: заплатил рублями — включил.",
  },
  {
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Прозрачные цены",
    desc: `4 понятных тарифа без скрытых комиссий и автопродлений. Free (10 запросов/день), Start (${planPrice("mini")}), Pro (${planPrice("max")}), Elite (${planPrice("max-pro")}). Pay-per-use для инструментов. Лимиты на подписках честно показаны на странице тарифов — никаких сюрпризов «вы превысили лимит, который мы вам не показали».`,
  },
  {
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    title: "Безопасность",
    desc: "Stone AI не хранит содержимое запросов для обучения моделей. Все запросы идут через API с явным opt-out из training. История чатов хранится на серверах в России и доступна только вам. Платежи через сертифицированного партнёра Platega с лицензией ЦБ РФ. Данные передаются провайдерам по зашифрованному каналу TLS 1.3.",
  },
  {
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    title: "Всё в одном месте",
    desc: "AI-чат со всеми моделями, конструктор ботов с базой знаний (RAG), автономный AI-агент, генератор рекламных кампаний для Яндекс Директ, презентации, фотосессия товаров для маркетплейсов, SEO-модуль с A/B тестами, генерация видео и 3D — одна подписка, один логин, одна общая история. Не нужно переключаться между 6 вкладками.",
  },
];

const timeline = [
  { year: "2024 Q3", event: "Старт Stone AI как Telegram-бота с 10 AI-моделями. Первые 1 000 бета-пользователей. Тестирование платежной инфраструктуры." },
  { year: "2024 Q4", event: "Публичный запуск. Добавлена генерация изображений (DALL-E, Midjourney через API). Подписочная модель, 3 способа оплаты. Первые 5 000 пользователей." },
  { year: "2025 Q1", event: "Расширение до 30+ моделей. Добавлены видео (Runway, Kling v1, Pika). 10 000 активных юзеров. Запуск реферальной программы." },
  { year: "2025 Q2", event: "Запуск веб-версии stoneai.ru (до этого только Telegram-бот). Добавлены 3D (Tripo), аудио (Suno, Whisper). 13 000 юзеров." },
  { year: "2025 Q3", event: "Переход на новую архитектуру биллинга: единый баланс между ботом и вебом, синхронизация подписки. Добавлен AI-агент." },
  { year: "2025 Q4", event: "65+ моделей в каталоге. Добавлены Claude Opus 4.5, GPT-5.4, Gemini 3 Pro, Sora 2, Nano Banana Pro. Фотосессия товаров. SEO-модуль." },
  { year: "2026 Q1", event: "15 000+ пользователей. Интеграция с Yandex Webmaster и Google Search Console. Запуск конструктора ботов с RAG (база знаний)." },
  { year: "2026 Q2", event: "Оптимизация для AI-поиска (llms.txt, GEO). Publications на VC.ru и Habr. Расширение блога до 25+ статей." },
];

const techStack = [
  { name: "OpenAI", models: "GPT-5.4, GPT-5.1, GPT-4.1, GPT-4o mini, o3, o4-mini, GPT-5 Image" },
  { name: "Anthropic", models: "Claude Opus 4.5, Sonnet 4.5, Haiku 4.5, Haiku Thinking" },
  { name: "Google", models: "Gemini 3 Pro, 2.5 Pro, 2.5 Flash, 2.0 Flash, Gemma 3" },
  { name: "Meta", models: "Llama 4 Maverick, Llama 3.3 70B" },
  { name: "xAI", models: "Grok 3, Grok 3 Mini" },
  { name: "DeepSeek", models: "R1, V3, V3.2" },
  { name: "Mistral", models: "Mistral Large 25, Mistral Small, Devstral" },
  { name: "Alibaba", models: "Qwen 3 235B, Qwen Turbo, Qwen QwQ" },
  { name: "Midjourney", models: "V7" },
  { name: "Google DeepMind", models: "Veo 3, Veo 3.1, Nano Banana, Nano Banana Pro" },
  { name: "Kuaishou", models: "Kling v2, Kling v3" },
  { name: "Runway", models: "Gen-3 Alpha" },
  { name: "Pika, Luma, MiniMax, PixVerse, Hunyuan", models: "Семейство видео-моделей" },
  { name: "Perplexity", models: "Sonar, Sonar Pro, Sonar Deep" },
  { name: "Suno", models: "Suno v4 (музыка)" },
  { name: "Tripo3D, Stability", models: "Tripo v2.5, TripoSR (3D)" },
];

const tools = [
  { icon: "💬", name: "AI Чат",            href: "/dashboard/chat",          desc: "50+ моделей, стриминг, DualChat" },
  { icon: "🤖", name: "Конструктор ботов", href: "/dashboard/bots",          desc: "Бот с базой знаний (RAG)" },
  { icon: "🧠", name: "AI-Агент",          href: "/dashboard/agent",         desc: "Автономные multi-step задачи" },
  { icon: "📊", name: "Рекламные кампании",href: "/dashboard/campaigns",     desc: "Яндекс Директ за 3 минуты" },
  { icon: "📝", name: "AI-шаблоны",        href: "/dashboard/templates",     desc: "50+ готовых промптов" },
  { icon: "📷", name: "Фотосессия товаров",href: "/dashboard/photo-session", desc: "Смена фона, на модели, пакетная" },
  { icon: "🎬", name: "Презентации",       href: "/dashboard/presentations", desc: "Слайды + PPTX экспорт" },
  { icon: "🔍", name: "SEO-модуль",        href: "/dashboard/seo",           desc: "Статьи, мета-теги, A/B тесты" },
  { icon: "🌐", name: "Виджет для сайта",  href: "/widget",                  desc: "Встраиваемый чат-бот" },
  { icon: "📱", name: "Telegram-боты",     href: "https://t.me/drifttt55bot", external: true, desc: "Подключение через BotFather" },
  { icon: "📈", name: "Аналитика",         href: "/admin",                   desc: "Отслеживание посещений" },
  { icon: "🏆", name: "Геймификация",      href: "/dashboard/games",         desc: "Достижения, игры, лидерборд" },
];

const audiences = [
  { role: "Маркетологи и SMM", desc: "Контент-планы, сценарии для рилсов, тексты постов, визуалы для соцсетей, анализ конкурентов, генерация рекламных креативов. Экономят до 60% времени на рутинных задачах." },
  { role: "Копирайтеры и редакторы", desc: "Тексты для блога и email, рерайт, перевод статей, проверка на ошибки, адаптация под тон бренда. Claude Opus для длинных материалов, Sonnet для оперативной работы." },
  { role: "Разработчики", desc: "Code review, объяснение чужого кода, рефакторинг, debugging, документация. Claude Sonnet 4.5 + Opus 4.5 покрывают весь стек — от prototype до production." },
  { role: "Дизайнеры", desc: "Мокапы, концепт-арт, иллюстрации, логотипы через Midjourney V7 и Nano Banana Pro. Фотосессия товаров для маркетплейсов — смена фона, модель на товаре, пакетная генерация." },
  { role: "Предприниматели и малый бизнес", desc: "Автоматизация создания контента, аналитика конкурентов, генерация идей для продукта, обработка писем клиентов, создание Telegram-ботов без кода." },
  { role: "Студенты и учителя", desc: "Подготовка к экзаменам, написание курсовых, создание учебных материалов, планы уроков, проверка работ. Free-тариф покрывает основные задачи." },
];

const faqItems = [
  {
    q: "Кто стоит за Stone AI? Это частная компания или корпорация?",
    a: "Stone AI — независимый частный проект, основан в 2024 году российским фаундером. Команда — несколько человек: разработчики, продакт-менеджер, контент-редактор. Юридически оформлены в странах с прямым доступом к западным AI-API, чтобы легально перепродавать доступ россиянам в рублях.",
  },
  {
    q: "Сколько пользователей у платформы сейчас?",
    a: "На апрель 2026 — 15 305 активных пользователей в Telegram-боте и на веб-версии. Около 30% из них — платные подписчики (Start, Pro, Elite). Основная аудитория — русскоязычные маркетологи, копирайтеры, разработчики, предприниматели из России, СНГ и русскоязычной диаспоры за рубежом.",
  },
  {
    q: "Откуда берётся доход? Как это бизнес-модель работает?",
    a: "Мы оплачиваем API-ключи у провайдеров по корпоративным тарифам (оптовые цены), получаем подписочные платежи в рублях, разницу кладём в маржу. Никакой рекламы, никакой продажи данных, никаких «бесплатных» версий с задачей собрать телеметрию. Только подписки и оплата за использование инструментов.",
  },
  {
    q: "Что будет, если OpenAI или Anthropic вас заблокирует?",
    a: "У нас несколько юрлиц в разных странах и запасные маршруты доступа. За 2+ года существования подобных сервисов на рынке ни один крупный агрегатор не был закрыт со стороны западных провайдеров — модель работает стабильно. Если какой-то конкретный провайдер станет недоступен — пользователи могут переключиться на альтернативные модели внутри Stone AI (в этом ценность агрегатора).",
  },
  {
    q: "Какая модель у вас самая популярная?",
    a: "По количеству запросов топ-5 на апрель 2026: 1) GPT-5.4 (21% всех запросов), 2) Claude Sonnet 4.5 (16%), 3) Claude Opus 4.5 (12%), 4) Gemini 2.5 Pro (10%), 5) Nano Banana Pro (8%, генерация картинок). Остальные ~33% размазаны по 60+ моделям.",
  },
  {
    q: "Как вы подключаете свежие модели — сразу после релиза?",
    a: "Типовой цикл — 2-4 дня после релиза у разработчика. За это время мы тестируем API, настраиваем pricing и лимиты, интегрируем в UI. В экстренных случаях (если пользователи массово просят) — можем подключить за сутки. Для сравнения: у большинства конкурентов 5-10 дней, а у мелких агрегаторов — до месяца.",
  },
  {
    q: "Есть ли API для разработчиков?",
    a: "Да, на тарифе Elite. API совместим с OpenAI-форматом — заменяете base_url на https://stoneai.ru/api/v1, используете Stone AI API-ключ в заголовке Authorization. Можно подключать наши модели к собственным Telegram-ботам, CRM-системам, Chrome-расширениям.",
  },
  {
    q: "Можно ли использовать Stone AI в корпоративной среде?",
    a: "Да. Для команд от 3 человек есть корпоративный тариф с общим биллингом, ролевым доступом и отчётностью по расходам. Подходит digital-агентствам, редакциям СМИ, маркетинговым командам. Подробности — через @StoneAIsupport в Telegram.",
  },
  {
    q: "Где находятся серверы? Где хранятся мои данные?",
    a: "Основная инфраструктура — в России. История чатов, персональные данные, платёжная информация — на российских серверах. Запросы к AI-моделям идут через API зарубежных провайдеров, но контент запросов не сохраняется у них для обучения (явный opt-out).",
  },
  {
    q: "Как вы принимаете feedback? Есть ли публичный roadmap?",
    a: "Feedback — через поддержку @StoneAIsupport в Telegram. Каждый запрос читает живой человек, отвечает в пределах часа. Публичного roadmap пока нет, но ежемесячные дайджесты новых фич публикуются в официальном канале и email-рассылке для подписчиков.",
  },
  {
    q: "Почему «Stone» AI? Что значит название?",
    a: "STONE — Smart Technology Omniscient Neural Engine. Расшифровка появилась уже после названия — изначально выбрали «Stone» из-за ассоциации с надёжностью, стабильностью, простотой (в противовес хайповым AI-названиям типа «Quantum», «Neo», «Fusion»). Хотели, чтобы продукт воспринимался как рабочий инструмент, а не tech-новинка.",
  },
  {
    q: "Чем Stone AI отличается от Study24, GPTunnel, Chad AI и других российских агрегаторов?",
    a: "Тремя вещами. Первое — самый полный стек модальностей: только у Stone AI в одной подписке есть текст + картинки + видео + 3D + аудио + поиск. Второе — лучшая цена за 100 запросов в тарифе Pro (~86₽). Третье — самая быстрая поддержка на рынке (среднее время ответа — 47 минут через Telegram).",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <Breadcrumbs items={[{ label: "О нас", href: "/about" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "О Stone AI",
        description: "Stone AI — российская платформа-агрегатор для работы с 65+ нейросетями.",
        url: "https://stoneai.ru/about",
        inLanguage: "ru-RU",
        mainEntity: {
          "@type": "Organization",
          "@id": "https://stoneai.ru/#organization",
        },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            О компании
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6">
            Все нейросети мира
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              в одном окне
            </span>
          </h1>
          <p className="text-text/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Stone AI — Smart Technology Omniscient Neural Engine — российская платформа-агрегатор, которая объединяет
            65+ нейросетей и 15+ инструментов для бизнеса в одном интерфейсе. Без VPN, с оплатой в рублях, с историей чатов на русском.
          </p>
          <div className="mt-6">
            <img src="/mascots/stone-mascot-idle.webp" alt="Stone AI маскот" width="120" height="120" className="mx-auto" />
          </div>
        </div>

        {/* Stats */}
        <StatBlock
          stats={[
            { value: "15 305", label: "Активных пользователей", sub: "апрель 2026", accent: true },
            { value: "65+", label: "AI-моделей", sub: "от 16 провайдеров" },
            { value: "99.5%", label: "Uptime за год", sub: "янв 2025 — апр 2026" },
            { value: "47 мин", label: "Время ответа поддержки", sub: "медиана в Telegram" },
          ]}
        />

        {/* Narrative: почему создали */}
        <section className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Почему мы создали Stone AI</h2>
          <div className="space-y-4 text-text/75 text-[15px] leading-[1.8]">
            <p>
              В 2024 году российский пользователь AI оказался в парадоксальной ситуации. С одной стороны — рекордный выбор нейросетей: GPT-5 от OpenAI, Claude Opus от Anthropic, Gemini от Google, Midjourney для картинок, Sora для видео, Suno для музыки. С другой стороны — всё это заблокировано на уровне IP, стоит долларов, требует иностранных карт и работает только через VPN, который РКН блокирует всё чаще и чаще.
            </p>
            <p>
              Фаундер Stone AI, Артём Доченков, сам был этим пользователем. Подписка на ChatGPT Plus через перекупа, Claude через знакомого в Сербии, Midjourney через третий обменник, Perplexity через четвёртый, ещё VPN за 400₽/мес, три иностранные карты «на всякий случай». Полная сумма — почти 9 000₽ в месяц. И каждую пятницу — борьба с упавшим VPN перед сдачей клиентского отчёта.
            </p>
            <p>
              Изначально проект задумывался как личный инструмент для решения этой боли — один бот с одной подпиской, который обслуживает все нейросети сразу. Но после трёх месяцев в закрытой бете стало понятно: в этом нуждаются не единицы, а десятки тысяч русскоязычных юзеров, которые ежедневно воюют с западной AI-инфраструктурой.
            </p>
          </div>

          <Callout variant="tip" title="Про нашу модель в двух предложениях">
            Мы оплачиваем корпоративные API-ключи у OpenAI, Anthropic, Google, Midjourney и других провайдеров — через наше юрлицо в стране с прямым доступом. Вы платите рублями российской картой через СБП — получаете доступ к тем же самым моделям через удобный интерфейс на русском. Это легальная модель перепродажи через API — такая же, как Poe, Merlin или ChatHub на западных рынках.
          </Callout>
        </section>

        {/* Founder quote */}
        <section className="max-w-3xl mx-auto mb-16">
          <Quote
            accent
            text="Мы не «русский ChatGPT». Мы — мост между русскоязычными пользователями и мировым AI-рынком. Наша задача — не конкурировать с OpenAI или Anthropic, а убрать барьеры: VPN, иностранные карты, комиссии посредников, переключение между пятью сервисами. Один логин, 65+ моделей, оплата Сбером."
            author="Артём Доченков"
            role="Основатель Stone AI"
            url="/authors/dochstone"
          />
        </section>

        {/* Tools grid */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">Что умеет Stone AI</h2>
          <p className="text-text/50 text-center mb-10 max-w-lg mx-auto">Не просто чат — полноценная AI-платформа для работы и бизнеса</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tools.map((t) => (
              <a
                key={t.name}
                href={t.href}
                {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group relative block overflow-hidden bg-white rounded-xl border border-text/5 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 motion-reduce:transition-none motion-reduce:hover:transform-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-accent/5 via-transparent to-teal/5 transition-opacity duration-300" />
                <span className="relative z-10 inline-block text-2xl mb-2 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transform-none">
                  {t.icon}
                </span>
                <div className="relative z-10 font-bold text-sm mb-0.5 transition-colors duration-200 group-hover:text-accent">{t.name}</div>
                <div className="relative z-10 text-text/40 text-[11px] transition-colors duration-200 group-hover:text-text/60">{t.desc}</div>
              </a>
            ))}
          </div>
        </section>

        {/* Target audiences */}
        <section className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-8">Кому подходит Stone AI</h2>
          <div className="space-y-5">
            {audiences.map((a) => (
              <div key={a.role} className="border-l-4 border-accent/30 pl-5">
                <h3 className="font-bold text-lg mb-1">{a.role}</h3>
                <p className="text-text/60 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
          <Callout variant="info" title="Stone AI не для всех — давайте честно">
            Если вы прямо сейчас живёте в Claude Opus по 10 часов в день как ML-исследователь — вам лучше завести Claude Max напрямую через зарубежное юрлицо. Наш Pro-тариф покрывает 112 Opus-запросов в месяц, Elite — существенно больше, но для интенсивного ML-исследования или биржевого HFT-торгового бота агрегатор не оптимален. Мы ориентированы на широкого потребителя AI — маркетологов, копирайтеров, разработчиков, предпринимателей.
          </Callout>
        </section>

        {/* Values */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">Наши принципы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-text/5 p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-text/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">История развития</h2>
          <div className="max-w-2xl mx-auto space-y-5">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-20 text-right">
                  <span className="text-xs font-bold text-accent">{t.year}</span>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[4px] top-4 w-0.5 h-full bg-text/10" />
                  )}
                </div>
                <p className="text-text/70 text-sm leading-relaxed pl-4">{t.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Partners */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">Технологические партнёры</h2>
          <p className="text-text/50 text-center mb-10 max-w-lg mx-auto">
            Модели подключены напрямую через корпоративные API-ключи, без посредников
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {techStack.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-text/5 p-4 hover:border-accent/20 transition-colors">
                <div className="font-bold text-sm mb-1">{t.name}</div>
                <div className="text-text/40 text-xs leading-snug">{t.models}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqExtended items={faqItems} />

        {/* Contact */}
        <section className="bg-gradient-to-r from-accent/10 to-teal/10 rounded-2xl border border-accent/10 p-8 md:p-12 text-center mt-16">
          <img src="/mascots/stone-mascot-chat.webp" alt="Stone AI маскот в чате" width="80" height="80" className="mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-4">Связаться с нами</h2>
          <p className="text-text/50 text-sm mb-8 max-w-md mx-auto">
            Вопросы, предложения, сотрудничество, баг-репорты, корпоративные тарифы
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer"
              className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-colors">
              Написать в поддержку
            </a>
            <a href="mailto:dochstone@gmail.com"
              className="border-2 border-text/15 text-text px-8 py-3.5 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors">
              Email
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
