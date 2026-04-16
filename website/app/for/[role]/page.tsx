import type { Metadata } from "next";
import { planPrice, planPriceFull } from "@/lib/pricing";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { PROFESSIONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CrossLinks } from "@/components/CrossLinks";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { role: string } }

export function generateStaticParams() { return PROFESSIONS.map((p) => ({ role: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) return {};
  return {
    title: prof.title, description: prof.description,
    alternates: { canonical: `${SITE_URL}/for/${prof.slug}` },
    openGraph: { title: prof.title, description: prof.description, url: `${SITE_URL}/for/${prof.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function ProfessionPage({ params }: Props) {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) notFound();

  const benefitsMap: Record<string, string[]> = {
    marketer: ["Пост для соцсетей за 30 секунд — текст + картинка + хештеги", "SEO-статья на 3000 слов за 10 минут с ключами и FAQ", "5 рекламных объявлений для Директа за 30 секунд", "Баннер или карточка товара за 15₽ — без дизайнера", "Промо-видео для Reels за 150₽ — вместо 50 000₽ у агентства", "Анализ конкурента с рекомендациями — за 2 минуты"],
    developer: ["Генерация кода на любом языке за секунды", "Автоматический code review и поиск багов", "Ускорение разработки в 3-10 раз", "Написание тестов и документации", "Помощь с архитектурными решениями", "Поддержка 50+ языков программирования"],
    copywriter: ["Черновик статьи на 2000 слов за 5 минут", "Рерайт и уникализация текстов", "Адаптация тона под бренд и аудиторию", "SEO-оптимизация без специальных знаний", "Генерация контент-планов на месяц", "Работа с 65+ моделями для разных задач"],
    designer: ["Генерация 10+ вариантов за минуту", "Продуктовые фото без фотостудии", "Поддержка любых стилей и направлений", "Экономия на фотостоках и фрилансерах", "Быстрое прототипирование идей", "Создание видео и 3D из текста"],
    student: ["10 бесплатных запросов каждый день", "Пошаговое объяснение сложных тем", "Помощь с математикой и программированием", "Генерация конспектов и планов работ", "Подготовка к экзаменам с AI-тренажёром", "Перевод и работа с иностранными текстами"],
    business: ["Экономия 15-20 часов в неделю на рутине", "Генерация КП и презентаций за минуты", "Анализ конкурентов и рынка с AI", "Автоматизация поддержки клиентов", "Создание визуала без дизайнера", "Документы и договоры по шаблонам"],
    teacher: ["Экономия 5-8 часов на подготовке к урокам", "Генерация тестов и контрольных за минуты", "Дифференцированные задания по уровням", "Проверка сочинений с обратной связью", "Интерактивные задания и квизы", "10 бесплатных запросов каждый день"],
    smm: ["Контент-план на месяц за 10 минут", "Генерация постов для всех площадок", "Сценарии Reels и коротких видео", "Уникальные изображения без фотостоков", "Анализ эффективности контента", "Ответы на комментарии в тоне бренда"],
  };
  const benefits = benefitsMap[prof.slug] || benefitsMap.student;

  const howToStartMap: Record<string, { step: string; desc: string }[]> = {
    marketer: [
      { step: "Откройте чат Stone AI", desc: "Зайдите на stoneai.ru/webchat или в Telegram-бот. Регистрация за 10 секунд — через Google, Яндекс или email. Бонус 100₽ на баланс сразу после регистрации." },
      { step: "Выберите модель под задачу", desc: "Для текстов и постов — GPT-5 или Claude Sonnet 4. Для SEO-статей — GPT-4.1. Для анализа конкурентов — DeepSeek R1. Для картинок — Nano Banana (бесплатно) или GPT-5 Image." },
      { step: "Напишите промпт с контекстом", desc: "Укажите целевую аудиторию, тон бренда, площадку размещения и желаемый формат. Чем больше контекста — тем точнее результат. Используйте готовые промпты из нашей библиотеки." },
      { step: "Доработайте и опубликуйте", desc: "AI даёт черновик за секунды. Добавьте свою экспертизу, проверьте факты, адаптируйте под бренд. Результат готов к публикации за 5-10 минут вместо часа." },
    ],
    developer: [
      { step: "Откройте чат Stone AI", desc: "Зайдите на stoneai.ru/webchat. Поддержка всех языков: Python, JavaScript, TypeScript, Go, Rust, Java, C++, PHP, Ruby, Swift и десятков других." },
      { step: "Выберите код-модель", desc: "Claude Opus 4 — для сложного рефакторинга и архитектуры. Devstral — специализированная код-модель от Mistral. DeepSeek V3 — бесплатная и мощная для повседневных задач." },
      { step: "Опишите задачу или вставьте код", desc: "Вставьте код для ревью, опишите функцию для генерации или задайте вопрос по архитектуре. AI понимает контекст фреймворков: React, Next.js, FastAPI, Django, Spring." },
      { step: "Итерируйте в диалоге", desc: "Попросите AI доработать, добавить тесты, оптимизировать или объяснить решение. Каждый следующий запрос учитывает контекст предыдущих — как разговор с коллегой." },
    ],
    copywriter: [
      { step: "Откройте чат Stone AI", desc: "Зайдите на stoneai.ru/webchat. 10 бесплатных запросов в день — хватит для нескольких текстов. GPT-4o mini бесплатен и хорошо пишет на русском." },
      { step: "Задайте формат и тон", desc: "Укажите: тип текста (статья, пост, email), объём, тон (деловой, дружелюбный), целевую аудиторию. AI адаптирует стиль под ваши требования." },
      { step: "Получите черновик за секунды", desc: "GPT-5 генерирует статью на 2000 слов за 30 секунд. Claude Sonnet — для экспертных длинных текстов. Уникальность обычно 90-100% без дополнительного рерайта." },
      { step: "Отредактируйте и усильте", desc: "Добавьте личный опыт, факты, цитаты экспертов. AI создаёт основу — вы превращаете её в авторский материал. Итого: 15 минут вместо 3 часов на статью." },
    ],
    designer: [
      { step: "Откройте чат Stone AI", desc: "Зайдите на stoneai.ru/webchat и переключитесь на вкладку «Картинки». 2 бесплатные генерации для новых пользователей." },
      { step: "Выберите модель", desc: "Nano Banana — быстрая бесплатная генерация для концептов. Nano Banana Pro — высокое качество. GPT-5 Image — фотореалистичные изображения для рекламы и маркетинга." },
      { step: "Опишите изображение детально", desc: "Укажите стиль (flat, isometric, photorealistic), настроение, цветовую палитру, композицию. Пример: «Минималистичный логотип кофейни, тёплые коричневые тона, flat design, белый фон»." },
      { step: "Выберите лучший вариант", desc: "Сгенерируйте несколько вариантов, выберите лучший. Для доработки — опишите что изменить. Готовые изображения можно использовать коммерчески без ограничений." },
    ],
    student: [
      { step: "Откройте чат бесплатно", desc: "Зайдите на stoneai.ru/webchat. Не нужна карта или подписка — 10 бесплатных запросов каждый день к 8 моделям: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3." },
      { step: "Задайте вопрос по учёбе", desc: "AI объяснит сложную тему простыми словами, решит задачу по математике пошагово, поможет с программированием или переводом. Укажите предмет и уровень." },
      { step: "Попросите объяснить подробнее", desc: "Если не поняли — попросите объяснить проще, привести пример или аналогию. AI терпеливо объясняет столько раз, сколько нужно, без осуждения." },
      { step: "Используйте для подготовки", desc: "AI генерирует конспекты, тестовые вопросы, планы сочинений и курсовых. Для математики используйте DeepSeek R1 — он показывает решение по шагам." },
    ],
    business: [
      { step: "Зарегистрируйтесь за 10 секунд", desc: "Откройте stoneai.ru/webchat. Вход через Google, Яндекс или email. Бонус 100₽ на баланс — хватит на 50+ запросов к базовым моделям." },
      { step: "Начните с типовых задач", desc: "Попросите AI написать коммерческое предложение, проанализировать рынок, составить бизнес-план или подготовить презентацию. Используйте готовые шаблоны." },
      { step: "Автоматизируйте рутину", desc: "AI создаёт договоры, обрабатывает входящие запросы, генерирует ответы на отзывы, пишет описания товаров для маркетплейсов. Экономия 15-20 часов в неделю." },
      { step: "Масштабируйте с подпиской", desc: `Подписка от ${planPriceFull("mini")} — доступ к GPT-5, Claude Opus, генерации картинок и видео. Дешевле одного часа работы фрилансера, но доступен 24/7.` },
    ],
    teacher: [
      { step: "Откройте чат бесплатно", desc: "Зайдите на stoneai.ru/webchat. 10 бесплатных запросов каждый день — хватит на подготовку 2-3 уроков. Без привязки карты." },
      { step: "Создайте план урока", desc: "Укажите класс, предмет, тему и время урока. AI сгенерирует план по ФГОС с целями, этапами, заданиями и хронометражем за 30 секунд." },
      { step: "Сгенерируйте материалы", desc: "Тесты, контрольные, карточки с заданиями, дифференцированные задачи по уровням сложности. AI учитывает возрастные особенности учеников." },
      { step: "Проверяйте работы быстрее", desc: "Загрузите текст сочинения — AI проверит грамматику, логику, аргументацию и даст обратную связь в поддерживающем тоне. Экономия 5-8 часов в неделю." },
    ],
    smm: [
      { step: "Откройте чат Stone AI", desc: "Зайдите на stoneai.ru/webchat. 10 бесплатных запросов в день + 2 бесплатные генерации картинок. Хватит для ежедневного контента." },
      { step: "Сгенерируйте контент-план", desc: "Укажите нишу, площадку (VK, Telegram, Instagram) и период. AI составит план с темами, форматами и лучшим временем публикации за 2 минуты." },
      { step: "Создайте посты и визуал", desc: "AI напишет текст поста адаптированный под площадку, сгенерирует картинку для иллюстрации и предложит хештеги. Один пост — 3 минуты вместо 30." },
      { step: "Масштабируйте контент", desc: "Попросите AI адаптировать один пост для разных площадок: длинный для Telegram, короткий для Instagram, с эмодзи для VK. Один текст → 3-4 публикации." },
    ],
  };
  const howToStart = howToStartMap[prof.slug] || howToStartMap.student;

  const resultsMap: Record<string, { metric: string; desc: string }[]> = {
    marketer: [
      { metric: "3 мин на пост", desc: "текст + картинка + хештеги — вместо 30 минут" },
      { metric: "150₽ за ролик", desc: "промо-видео для Reels вместо 50 000₽ у агентства" },
      { metric: "10 запросов/день", desc: "бесплатно к 10 моделям — без карты и VPN" },
      { metric: `от ${planPriceFull("mini")}`, desc: "65+ нейросетей: текст, картинки, видео, SEO" },
    ],
    developer: [
      { metric: "в 3-10 раз быстрее", desc: "написание кода, тестов и документации" },
      { metric: "50+ языков", desc: "Python, JS, Go, Rust, Java, C++ и другие" },
      { metric: "65+ моделей", desc: "Claude Opus, GPT-5, Devstral — под разные задачи" },
      { metric: "дешевле Copilot", desc: `от ${planPriceFull("mini")} вместо $19/мес за GitHub Copilot` },
    ],
    copywriter: [
      { metric: "2000 слов за 5 мин", desc: "черновик статьи с правильной структурой" },
      { metric: "90-100% уникальность", desc: "оригинальный контент без рерайта" },
      { metric: "15 мин вместо 3 ч", desc: "на создание готовой к публикации статьи" },
      { metric: "SEO из коробки", desc: "H2, списки, FAQ, мета-теги — автоматически" },
    ],
    designer: [
      { metric: "10+ вариантов/мин", desc: "генерация концептов и иллюстраций" },
      { metric: "0₽ за фотостоки", desc: "уникальные изображения вместо шаблонных" },
      { metric: "4 модели картинок", desc: "от бесплатной Nano Banana до GPT-5 Image" },
      { metric: "коммерческое право", desc: "все изображения можно использовать в бизнесе" },
    ],
    student: [
      { metric: "10 запросов/день", desc: "бесплатно, без карты и подписки" },
      { metric: "пошаговые решения", desc: "математика, физика, программирование" },
      { metric: "8 моделей", desc: "GPT-4o mini, Claude Haiku, DeepSeek и другие" },
      { metric: "без VPN", desc: "работает из России без ограничений" },
    ],
    business: [
      { metric: "15-20 ч/нед экономии", desc: "на документах, КП, анализе и контенте" },
      { metric: `от ${planPriceFull("mini")}`, desc: "дешевле одного часа фрилансера" },
      { metric: "24/7 доступность", desc: "AI-помощник работает без выходных" },
      { metric: "65+ инструментов", desc: "текст, картинки, видео, SEO, презентации" },
    ],
    teacher: [
      { metric: "5-8 ч/нед экономии", desc: "на подготовке уроков и проверке работ" },
      { metric: "план урока за 30 сек", desc: "по ФГОС с целями и хронометражем" },
      { metric: "10 запросов/день", desc: "бесплатно — хватит на 2-3 урока" },
      { metric: "дифференциация", desc: "задания по уровням за минуту" },
    ],
    smm: [
      { metric: "контент-план за 10 мин", desc: "на месяц для любой площадки" },
      { metric: "3 мин на пост", desc: "текст + картинка + хештеги" },
      { metric: "1 текст → 4 площадки", desc: "адаптация под VK, Telegram, Instagram, TikTok" },
      { metric: "2 картинки бесплатно", desc: "Nano Banana для быстрых иллюстраций" },
    ],
  };
  const results = resultsMap[prof.slug] || resultsMap.student;

  const faqItemsMap: Record<string, { q: string; a: string }[]> = {
    marketer: [
      { q: "Какие AI модели лучше для маркетолога?", a: `Для контент-маркетинга — GPT-5 и Claude Sonnet 4. Для SEO — GPT-4.1 и DeepSeek R1. Для аналитики — DeepSeek R1 и o4-mini. Для изображений — Nano Banana (бесплатно) и GPT-5 Image.` },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Для генерации изображений — 2 бесплатные генерации. Без привязки карты." },
      { q: "AI заменит маркетолога?", a: "Нет. AI ускоряет работу маркетолога в 3-10 раз, автоматизируя рутину: написание текстов, создание изображений, анализ данных. Стратегия, креатив и принятие решений — за вами." },
      { q: "Подходит ли AI для малого бизнеса?", a: `Да, AI особенно полезен для малого бизнеса, где один человек совмещает роли маркетолога, копирайтера и дизайнера. Stone AI от ${planPriceFull("mini")} заменяет несколько инструментов.` },
      { q: "Как AI помогает с SEO?", a: "AI генерирует SEO-статьи с правильной структурой (H2, списки, FAQ), подбирает ключевые слова, пишет мета-теги и title. Модели DeepSeek R1 и GPT-4.1 особенно хороши для SEO-задач." },
      { q: "Можно ли генерировать изображения для рекламы?", a: "Да, в Stone AI доступны 4 модели для генерации изображений. Nano Banana — бесплатная для быстрых иллюстраций. GPT-5 Image — для фотореалистичного качества в рекламных материалах." },
    ],
    developer: [
      { q: "Какая модель лучше всего пишет код?", a: "Claude Opus 4 — лучшая модель для программирования: сложный рефакторинг, архитектура, длинный контекст. Devstral — специализированная код-модель от Mistral. GPT-5 — универсальный вариант." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день. Бесплатные модели: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Llama 4 — все подходят для кода." },
      { q: "AI заменит программиста?", a: "Нет. AI ускоряет разработку в 3-10 раз, но не заменяет инженерное мышление. AI генерирует код, но проектирование архитектуры, выбор решений и ответственность — за разработчиком." },
      { q: "Какие языки программирования поддерживаются?", a: "Все популярные: Python, JavaScript/TypeScript, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL и десятки других. AI понимает фреймворки: React, Next.js, FastAPI, Spring и т.д." },
      { q: "Безопасно ли отправлять код в AI?", a: "Stone AI не хранит и не использует ваш код для обучения моделей. Данные передаются по HTTPS и удаляются после обработки. Для конфиденциальных проектов рекомендуем не отправлять секреты и API-ключи." },
      { q: "Чем Stone AI лучше GitHub Copilot?", a: "Stone AI даёт доступ к 65+ моделям (Claude Opus, GPT-5, Devstral) в одном интерфейсе. Copilot привязан к VS Code и одной модели. Stone AI дешевле и универсальнее — код, тексты, картинки, видео." },
    ],
    copywriter: [
      { q: "Какие модели лучше для текстов?", a: "GPT-5.1 — лучший для креативных и продающих текстов. Claude Sonnet 4 — для экспертных статей и длинных форматов. Claude Opus 4 — для редактуры и стилистической правки." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Для большинства задач копирайтера хватает GPT-4o mini (бесплатный) — он хорошо пишет на русском." },
      { q: "AI пишет уникальные тексты?", a: "Да, AI генерирует оригинальный контент, не копируя из интернета. Уникальность обычно 90-100% по text.ru и Advego. Рекомендуем редактировать и дополнять тексты своей экспертизой." },
      { q: "AI заменит копирайтера?", a: "AI ускоряет работу копирайтера в 5 раз, но не заменяет экспертизу. AI создаёт черновики, копирайтер доводит их до совершенства, добавляет личный опыт и факт-чекинг." },
      { q: "Подходит ли для SEO-копирайтинга?", a: "Да. AI генерирует SEO-статьи с правильной структурой, вписывает ключевые слова естественно, создаёт мета-теги и FAQ-блоки. Stone AI также имеет встроенные SEO-инструменты." },
      { q: "Можно ли задать тон и стиль?", a: "Да, в промпте указывайте тон (деловой, дружелюбный, экспертный), целевую аудиторию и примеры желаемого стиля. AI адаптирует текст под ваши требования." },
    ],
    designer: [
      { q: "Какие модели генерируют изображения?", a: "В Stone AI 4 модели: Nano Banana (бесплатная, быстрая), Nano Banana Pro (высокое качество), GPT-5 Image (фотореализм), GPT-5 Image Mini (быстрая от OpenAI)." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 2 бесплатные генерации изображений для новых пользователей. Для текстовых задач (описание концептов) — 10 бесплатных запросов в день." },
      { q: "AI заменит дизайнера?", a: "Нет. AI генерирует концепты и черновики, но финальная доработка, брендинг и дизайн-система — работа дизайнера. AI экономит часы на поиске референсов и создании вариантов." },
      { q: "Можно ли генерировать в определённом стиле?", a: "Да, в промпте укажите стиль: flat design, isometric, watercolor, photorealistic, cyberpunk, minimalism и другие. AI понимает стили и художественные направления." },
      { q: "Какое разрешение у сгенерированных изображений?", a: "До 1024x1024 и выше в зависимости от модели. GPT-5 Image даёт высокое разрешение, подходящее для печати и маркетинговых материалов." },
      { q: "Можно ли использовать изображения коммерчески?", a: "Да, сгенерированные изображения можно использовать в коммерческих целях: реклама, сайты, социальные сети, печатная продукция." },
    ],
    student: [
      { q: "Это действительно бесплатно?", a: "Да, 10 бесплатных запросов каждый день к 8 моделям: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Llama 4 и другие. Без привязки карты, без подписки." },
      { q: "Можно ли использовать для курсовых и дипломных?", a: "AI помогает с составлением плана, поиском источников, оформлением по ГОСТу и объяснением сложных тем. Но работа должна быть вашей — AI это инструмент, а не автор." },
      { q: "AI решает задачи по математике?", a: "Да, модели DeepSeek R1 и o4-mini специализируются на математике и логике. Они решают задачи пошагово, объясняя каждое действие — это помогает разобраться в методе решения." },
      { q: "AI заменит преподавателя?", a: "Нет, AI дополняет обучение. Он терпеливо объясняет тему столько раз, сколько нужно, простыми словами и с примерами. Но проверка знаний и оценка — за преподавателем." },
      { q: "Можно ли загружать PDF и документы?", a: "Да, в Stone AI можно загрузить документ и задать вопросы по его содержимому. AI проанализирует текст и даст ответы на основе загруженного материала." },
      { q: "Работает ли без VPN?", a: "Да, Stone AI полностью работает из России без VPN. Сайт, Telegram-бот и все 65+ нейросетей доступны без ограничений." },
    ],
    business: [
      { q: "Какие AI модели лучше для бизнеса?", a: "Для аналитики и отчётов — DeepSeek R1 и Claude Opus 4. Для текстов и КП — GPT-5 и Claude Sonnet 4. Для изображений — GPT-5 Image. Для быстрых задач — GPT-4o mini (бесплатно)." },
      { q: "Можно ли использовать бесплатно?", a: `Да, 10 бесплатных запросов в день к 8 моделям. Для малого бизнеса этого может хватить для базовых задач. Подписка от ${planPriceFull("mini")}.` },
      { q: "AI безопасен для бизнес-данных?", a: "Stone AI не хранит и не использует ваши данные для обучения. Передача по HTTPS. Не отправляйте пароли, ключи API и персональные данные клиентов." },
      { q: "Чем Stone AI лучше ChatGPT для бизнеса?", a: `Stone AI даёт 65+ моделей от всех провайдеров за одну подписку. ChatGPT Plus — только OpenAI за $20/мес (~1900₽). Stone AI от ${planPriceFull("mini")} + генерация картинок, видео, SEO.` },
      { q: "Можно ли использовать AI для автоматизации продаж?", a: "Да. AI генерирует скрипты продаж, обрабатывает возражения, создаёт цепочки email-рассылок и шаблоны для чат-ботов. Экономия на отделе продаж." },
      { q: "Подходит ли для создания контента?", a: "Да. AI создаёт посты для соцсетей, статьи для блога, описания товаров, рекламные тексты и email-рассылки. Плюс генерация изображений для маркетинга." },
    ],
    teacher: [
      { q: "Какие AI модели лучше для учителя?", a: "Для планов уроков и тестов — GPT-5 и Claude Sonnet 4. Для проверки работ — Claude Opus 4. Для математики — DeepSeek R1. Бесплатные: GPT-4o mini, Claude Haiku." },
      { q: "Это бесплатно для учителей?", a: `Да, 10 бесплатных запросов каждый день к 8 моделям. Без регистрации карты. Для интенсивной работы — подписка от ${planPriceFull("mini")}.` },
      { q: "AI создаёт задания по ФГОС?", a: "Да, AI понимает структуру ФГОС и генерирует планы уроков с целями, этапами и хронометражем. Укажите класс, предмет и тему в промпте." },
      { q: "Можно ли проверять сочинения через AI?", a: "Да. AI анализирует грамматику, логику, аргументацию и стиль. Даёт развёрнутую обратную связь в поддерживающем тоне. Claude Opus 4 лучше всего подходит для этой задачи." },
      { q: "AI заменит учителя?", a: "Нет. AI автоматизирует рутину: создание тестов, планов, проверка работ. Но педагогика, воспитание и индивидуальный подход — исключительно работа учителя." },
      { q: "Работает ли без VPN?", a: "Да, Stone AI полностью работает из России без VPN. Все 65+ нейросетей доступны без ограничений." },
    ],
    smm: [
      { q: "Какие AI модели лучше для SMM?", a: "Для текстов — GPT-5 и Claude Sonnet 4. Для контент-планов — GPT-4.1. Для Reels-сценариев — GPT-5 и Grok 3. Для картинок — Nano Banana (бесплатно) и GPT-5 Image." },
      { q: "Можно ли использовать бесплатно?", a: `Да, 10 бесплатных запросов в день к 8 моделям + 2 бесплатные генерации изображений. Для активной работы — подписка от ${planPriceFull("mini")}.` },
      { q: "AI создаёт контент для всех соцсетей?", a: "Да. AI адаптирует контент под VK, Telegram, Instagram, TikTok, YouTube. Укажите площадку в промпте — AI учтёт формат, длину и тон." },
      { q: "Можно ли генерировать картинки для постов?", a: "Да, 4 модели для генерации изображений. Nano Banana бесплатна для быстрых иллюстраций. GPT-5 Image — для профессионального маркетингового визуала." },
      { q: "AI заменит SMM-специалиста?", a: "Нет. AI ускоряет работу в 3-5 раз, генерируя черновики постов и контент-планы. Стратегия, tone of voice и работа с комьюнити — за специалистом." },
      { q: "Можно ли создавать видео для Reels?", a: "AI генерирует сценарии для Reels с hook, основной частью и CTA. Также доступны 12+ видео-моделей для генерации коротких промо-роликов из текстового описания." },
    ],
  };

  const faqItems = faqItemsMap[prof.slug] || [
    { q: `Какие AI модели лучше для ${prof.role.toLowerCase()}а?`, a: `Лучшие: ${prof.tasks.flatMap((t) => t.models).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((id) => MODELS.find((m) => m.id === id)?.name || id).join(", ")}.` },
    { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Без карты." },
    { q: "AI заменит мою работу?", a: `Нет. AI ускоряет работу ${prof.role.toLowerCase()}а в 3-10 раз, автоматизируя рутину. Творческие решения — за вами.` },
  ];

  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: prof.h1, description: prof.description, datePublished: "2026-04-11", dateModified: "2026-04-11", author: { "@type": "Organization", name: "Stone AI", url: SITE_URL }, publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL } };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "AI по профессиям", href: "/for" }, { label: `AI для ${prof.role.toLowerCase()}а`, href: `/for/${prof.slug}` }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{prof.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{prof.intro}</p>

        {/* Benefits */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Преимущества AI для {prof.role.toLowerCase()}а</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-bg rounded-xl border border-text/5 p-4">
                <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm text-text/70 font-medium">{b}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Early CTA */}
        <div className="mb-14 flex flex-col sm:flex-row items-center gap-4 bg-accent/5 border border-accent/15 rounded-2xl p-6">
          <div className="flex-1">
            <p className="font-bold text-text text-sm">Попробуйте бесплатно — 10 запросов/день</p>
            <p className="text-text/40 text-xs mt-1">65+ моделей. Без VPN. <Link href="/pricing" className="text-accent hover:underline">Подписка от {planPriceFull("mini")}</Link></p>
          </div>
          <Link href="/dashboard/chat" className="shrink-0 bg-accent text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-accent/90 transition-all">
            Открыть чат
          </Link>
        </div>

        {/* Tasks */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Задачи которые решает AI</h2>
          <div className="space-y-3">
            {prof.tasks.map((t) => (
              <div key={t.name} className="bg-bg rounded-2xl border border-text/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="font-bold text-text">{t.name}</h3>
                </div>
                <p className="text-sm text-text/50 mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {t.models.map((id) => {
                    const m = MODELS.find((x) => x.id === id);
                    return m ? (
                      <Link key={id} href={`/models/${id}`} className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-lg font-bold hover:bg-accent/20 transition-colors">
                        {m.name}
                      </Link>
                    ) : null;
                  })}
                  {t.models.some((id) => ["nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini"].includes(id)) && (
                    <Link href="/tools/image-generation" className="text-[11px] bg-text/5 text-text/40 px-2.5 py-1 rounded-lg font-medium hover:text-accent transition-colors">
                      Все модели картинок →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prompts */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Готовые промпты</h2>
          <div className="space-y-3">
            {prof.prompts.map((p) => (
              <div key={p.title} className="bg-bg rounded-2xl border border-text/5 p-6">
                <h3 className="font-bold text-text mb-2">{p.title}</h3>
                <pre className="text-sm text-text/50 bg-text/[0.03] rounded-xl p-4 whitespace-pre-wrap font-sans leading-relaxed">{p.prompt}</pre>
                <Link href="/dashboard/chat" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-accent hover:underline">
                  Попробовать в чате <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* How to start */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Как начать работу с AI</h2>
          <div className="space-y-4">
            {howToStart.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-extrabold text-sm">{i + 1}</div>
                <div>
                  <h3 className="font-bold text-text mb-1">{s.step}</h3>
                  <p className="text-sm text-text/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Какие результаты ожидать</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {results.map((r) => (
              <div key={r.metric} className="bg-bg rounded-2xl border border-text/5 p-5 text-center">
                <div className="text-xl font-extrabold text-accent mb-1">{r.metric}</div>
                <div className="text-[11px] text-text/40 leading-snug">{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed [&_a]:text-accent [&_a]:hover:underline [&_b]:text-text [&_b]:font-semibold [&_strong]:text-text [&_strong]:font-semibold [&_code]:bg-text/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded" dangerouslySetInnerHTML={{ __html: f.a }} />
              </details>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Почему Stone AI, а не ChatGPT?</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "ChatGPT Plus", price: "$20/мес (~1900₽)", models: "Только OpenAI", features: "Текст, картинки" },
              { label: "Stone AI", price: `от ${planPriceFull("mini")}`, models: "65+ моделей", features: "Текст, картинки, видео, 3D, SEO", accent: true },
              { label: "Claude Pro", price: "$20/мес (~1900₽)", models: "Только Anthropic", features: "Только текст" },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl border p-5 ${c.accent ? "border-accent/30 bg-accent/5" : "border-text/5 bg-bg"}`}>
                <div className={`text-sm font-bold mb-3 ${c.accent ? "text-accent" : "text-text/60"}`}>{c.label}</div>
                <div className="text-lg font-extrabold text-text mb-2">{c.price}</div>
                <div className="text-xs text-text/50 space-y-1">
                  <div>{c.models}</div>
                  <div>{c.features}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <Link href="/alternatives/chatgpt" className="text-xs text-accent hover:underline font-medium">Подробное сравнение с ChatGPT →</Link>
          </div>
        </section>

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте AI для вашей задачи</h2>
          <ChatWidget placeholder={`Задайте вопрос как ${prof.role.toLowerCase()}`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Начните использовать AI в работе</h2>
          <p className="text-white/40 text-sm mb-6">10 бесплатных запросов/день. 65+ нейросетей. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        <CrossLinks exclude={["for", "pricing"]} />

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">AI для других профессий</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PROFESSIONS.filter((p) => p.slug !== prof.slug).map((p) => (
              <Link key={p.slug} href={`/for/${p.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                AI для {p.role.toLowerCase()}а
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
