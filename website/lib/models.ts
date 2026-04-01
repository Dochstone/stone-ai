export type ModelTier = "free" | "pro";
export type ModelCategory = "chat" | "image" | "reason" | "search" | "code" | "video" | "3d";

export interface AIModel {
  id: string;
  name: string;
  company: string;
  tier: ModelTier;
  category: ModelCategory;
  pricePerMillion: number;
  priceUnit?: string;
  context: string;
  description?: string;
  strengths?: string[];
}

export const TELEGRAM_BOT_URL = "https://t.me/drifttt55bot";

export const MODELS: AIModel[] = [
  // TIER 1: FREE (5 models)
  { id: "gpt-4o-mini", name: "GPT-4o mini", company: "OpenAI", tier: "free", category: "chat", pricePerMillion: 2.5, context: "128K", description: "Быстрая и дешёвая модель OpenAI. Идеальна для простых задач, переводов и быстрых ответов.", strengths: ["Быстрая", "Бесплатная", "128K контекст"] },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", company: "Anthropic", tier: "free", category: "chat", pricePerMillion: 11.0, context: "200K", description: "Быстрый Claude для ежедневных задач. Хороший баланс цена/качество с 200К контекстом.", strengths: ["200K контекст", "Бесплатная", "Быстрая"] },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", company: "Google", tier: "free", category: "chat", pricePerMillion: 1.4, context: "1M", description: "Самая дешёвая модель Google с контекстом 1 миллион токенов. Мгновенные ответы.", strengths: ["1M контекст", "Бесплатная", "Самая дешёвая"] },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", company: "Meta", tier: "free", category: "chat", pricePerMillion: 1.76, context: "1M", description: "Open-source модель от Meta. Быстрая, с контекстом 1М. Хороша для творческих задач.", strengths: ["Open-source", "1M контекст", "Бесплатная"] },
  { id: "mistral-large-25", name: "Mistral Large", company: "Mistral", tier: "free", category: "chat", pricePerMillion: 17.6, context: "128K", description: "Мощная европейская модель. Сильна в мультиязычности и структурированных задачах.", strengths: ["Мультиязычная", "128K контекст", "Бесплатная"] },

  // TIER 2: MID (15 models)
  { id: "deepseek-r1", name: "DeepSeek R1", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 6.0, context: "164K", description: "Показывает ход мыслей. Конкурент o3 за 1/10 цены. Открытая архитектура, прозрачный reasoning.", strengths: ["Ход мыслей", "1/10 цены o3", "Open-source"] },
  { id: "deepseek-v3", name: "DeepSeek V3", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 1.5, context: "128K", description: "Универсальная модель DeepSeek. Отличное соотношение цена/качество для повседневных задач.", strengths: ["Дешёвая", "Универсальная", "128K"] },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 1.5, context: "128K", description: "Обновлённая версия V3. Улучшенный кодинг и следование инструкциям.", strengths: ["Кодинг", "Дешёвая", "Обновлённая"] },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 4.5, context: "1M", description: "Компактная модель OpenAI с контекстом 1M. Быстрее GPT-5, дешевле, хороша для кода.", strengths: ["1M контекст", "Кодинг", "Быстрая"] },
  { id: "gpt-4.1-nano", name: "GPT-4.1 nano", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 1.4, context: "1M", description: "Самая маленькая модель OpenAI. Ультрабыстрая для простых задач с 1M контекстом.", strengths: ["Ультрабыстрая", "1M контекст", "Дешёвая"] },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", company: "Google", tier: "pro", category: "chat", pricePerMillion: 1.68, context: "1M", description: "Быстрая модель Google нового поколения. 1М контекст, отличный кодинг.", strengths: ["1M контекст", "Быстрая", "Кодинг"] },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "200K", description: "Сбалансированная модель Anthropic. Отличное качество для анализа, текстов и кода.", strengths: ["Анализ", "Кодинг", "200K контекст"] },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "200K", description: "Улучшенный Sonnet с лучшим следованием инструкциям и творческими способностями.", strengths: ["Творчество", "Точность", "200K контекст"] },
  { id: "grok-3-mini", name: "Grok 3 mini", company: "xAI", tier: "pro", category: "chat", pricePerMillion: 1.68, context: "131K", description: "Компактный Grok от xAI. Прямые ответы, хороший юмор, низкая цена.", strengths: ["Дешёвая", "Прямые ответы", "131K"] },
  { id: "qwen-3-235b", name: "Qwen 3 235B", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 2.0, context: "40K", description: "Мощная китайская модель от Alibaba. 235 миллиардов параметров, сильна в логике.", strengths: ["235B параметров", "Логика", "Дешёвая"] },
  { id: "qwen-qwq", name: "Qwen QwQ 32B", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 2.0, context: "131K", description: "Reasoning-модель от Alibaba. Показывает ход мыслей, хороша для математики.", strengths: ["Reasoning", "Математика", "131K"] },
  { id: "minimax-m2.5", name: "MiniMax M2.5", company: "MiniMax", tier: "pro", category: "chat", pricePerMillion: 2.34, context: "1M", description: "Китайская модель с 1М контекстом. Сильна в длинных документах и анализе.", strengths: ["1M контекст", "Документы", "Дешёвая"] },
  { id: "glm-5", name: "GLM-5", company: "Zhipu", tier: "pro", category: "chat", pricePerMillion: 4.95, context: "128K", description: "Модель от Zhipu AI. Хорошо работает с китайским и английским языками.", strengths: ["Мультиязычная", "128K", "Анализ"] },
  { id: "command-r7", name: "Command R7", company: "Cohere", tier: "pro", category: "chat", pricePerMillion: 0.24, context: "128K", description: "Самая дешёвая модель в каталоге. Хороша для RAG и работы с документами.", strengths: ["Самая дешёвая", "RAG", "Документы"] },
  { id: "mistral-small", name: "Mistral Small", company: "Mistral", tier: "pro", category: "chat", pricePerMillion: 1.1, context: "32K", description: "Компактная европейская модель. Быстрая, хороша для классификации и саммари.", strengths: ["Быстрая", "Саммари", "Дешёвая"] },

  // TIER 3: PREMIUM (15 models)
  { id: "claude-opus-4", name: "Claude Opus 4", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 130.0, context: "200K", description: "Флагман Anthropic — лучший для текстового анализа и творчества. 200К контекст, глубокое понимание нюансов.", strengths: ["Текстовый анализ", "Творчество", "200K контекст"] },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 51.0, context: "200K", description: "Обновлённый Opus с улучшенным кодингом и мультимодальностью.", strengths: ["Кодинг", "Мультимодальность", "200K"] },
  { id: "gpt-4.1", name: "GPT-4.1", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 28.0, context: "1M", description: "Мощная модель OpenAI с 1М контекстом. Отличный кодинг и длинные документы.", strengths: ["1M контекст", "Кодинг", "Документы"] },
  { id: "gpt-5.1", name: "GPT-5.1", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 26.0, context: "400K", description: "Флагман OpenAI предыдущего поколения. Отличное качество для сложных задач.", strengths: ["Флагман", "400K контекст", "Сложные задачи"] },
  { id: "gpt-5.4", name: "GPT-5.4", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "1M", description: "Новейшая модель OpenAI с контекстом 1М токенов. Объединяет Codex и GPT. Встроенное управление компьютером.", strengths: ["1M контекст", "Computer Use", "Codex внутри"] },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", company: "Google", tier: "pro", category: "chat", pricePerMillion: 26.0, context: "1M", description: "Топовая модель Google с 1М контекстом. Лучшая в работе с таблицами, данными и мультимодальными задачами.", strengths: ["1M контекст", "Таблицы и данные", "Мультимодальная"] },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", company: "Google", tier: "pro", category: "chat", pricePerMillion: 24.0, context: "1M", description: "Новейшая модель Google третьего поколения. Улучшенное рассуждение и кодинг.", strengths: ["Новейшая", "1M контекст", "Рассуждение"] },
  { id: "grok-3", name: "Grok 3", company: "xAI", tier: "pro", category: "chat", pricePerMillion: 36.0, context: "131K", description: "Модель xAI Илона Маска. Без цензуры, прямые ответы, данные из X (Twitter) в реальном времени.", strengths: ["Без цензуры", "Данные из X", "Прямые ответы"] },
  { id: "perplexity-sonar-pro", name: "Perplexity Pro", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 26.0, context: "200K", description: "Премиум поиск с актуальными данными из интернета. Ссылки на источники.", strengths: ["Поиск в интернете", "Актуальные данные", "Источники"] },
  { id: "kimi-k2.5", name: "Kimi K2.5", company: "Moonshot", tier: "pro", category: "chat", pricePerMillion: 3.92, context: "128K", description: "Модель от Moonshot AI. Хороша для длинных документов и анализа.", strengths: ["Документы", "Анализ", "128K"] },
  { id: "o4-mini", name: "o4-mini", company: "OpenAI", tier: "pro", category: "reason", pricePerMillion: 12.32, context: "200K", description: "Компактная reasoning-модель OpenAI. Пошаговое рассуждение для логики и математики.", strengths: ["Reasoning", "Математика", "Логика"] },
  { id: "o3", name: "o3", company: "OpenAI", tier: "pro", category: "reason", pricePerMillion: 19.6, context: "200K", description: "Мощная reasoning-модель OpenAI. Глубокое рассуждение для самых сложных задач.", strengths: ["Глубокий reasoning", "Сложные задачи", "200K"] },
  { id: "claude-haiku-4.5-think", name: "Claude Haiku Think", company: "Anthropic", tier: "pro", category: "reason", pricePerMillion: 11.9, context: "200K", description: "Claude Haiku с расширенным мышлением. Reasoning по цене компактной модели.", strengths: ["Reasoning", "Дешёвый", "200K контекст"] },
  { id: "gemini-2.5-flash-think", name: "Gemini Flash Think", company: "Google", tier: "pro", category: "reason", pricePerMillion: 8.64, context: "1M", description: "Gemini Flash с пошаговым рассуждением и 1М контекстом.", strengths: ["1M контекст", "Reasoning", "Быстрая"] },
  { id: "devstral", name: "Devstral", company: "Mistral", tier: "pro", category: "code", pricePerMillion: 2.1, context: "128K", description: "Специализированная модель для кода от Mistral. Рефакторинг, дебаг, генерация на любом языке.", strengths: ["Код-специалист", "Дешёвая", "Все языки"] },

  // TIER 4: IMAGE (6 models)
  { id: "nano-banana-pro", name: "Nano Banana Pro", company: "Google", tier: "pro", category: "image", pricePerMillion: 32.0, context: "65K", description: "Фотореалистичные изображения 4K от Google. Текст на картинках, редактирование фото, студийное качество.", strengths: ["Фотореализм 4K", "Текст на картинках", "Редактирование"] },
  { id: "nano-banana", name: "Nano Banana", company: "Google", tier: "pro", category: "image", pricePerMillion: 1.68, context: "1M", description: "Быстрая генерация от Google. Дешёвая альтернатива для простых картинок.", strengths: ["Дешёвая", "Быстрая", "1M контекст"] },
  { id: "gpt-5-image", name: "GPT-5 Image", company: "OpenAI", tier: "pro", category: "image", pricePerMillion: 30.0, context: "128K", description: "Генерация изображений от OpenAI. Высокая детализация и точное следование промту.", strengths: ["Детализация", "Точность", "OpenAI качество"] },
  { id: "gpt-5-image-mini", name: "GPT-5 Image Mini", company: "OpenAI", tier: "pro", category: "image", pricePerMillion: 6.72, context: "128K", description: "Бюджетная генерация от OpenAI. Хороша для быстрых набросков и концептов.", strengths: ["Дешёвая", "Быстрая", "Концепты"] },
  { id: "flux-schnell", name: "Flux Schnell", company: "BFL", tier: "pro", category: "image", pricePerMillion: 0.012, priceUnit: "/img", context: "", description: "Быстрый генератор от Black Forest Labs. Мгновенные результаты.", strengths: ["Мгновенная", "Дешёвая"] },
  { id: "stable-diffusion-xl", name: "SDXL", company: "Stability", tier: "pro", category: "image", pricePerMillion: 0.04, priceUnit: "/img", context: "", description: "Классический Stable Diffusion XL. Хорош для художественных стилей.", strengths: ["Художественные стили", "Дешёвая"] },

  // TIER 5: FREE on OpenRouter (7 models)
  { id: "gemma-3-27b", name: "Gemma 3 27B", company: "Google", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "96K", description: "Компактная open-source модель Google. 27B параметров, хороша для быстрых задач.", strengths: ["Open-source", "Быстрая", "96K"] },
  { id: "gemma-3n-4b", name: "Gemma 3n 4B", company: "Google", tier: "pro", category: "chat", pricePerMillion: 0.5, context: "32K", description: "Ультракомпактная модель Google. 4B параметров, мгновенные ответы.", strengths: ["Ультралёгкая", "Мгновенная", "Дешёвая"] },
  { id: "phi-4", name: "Phi-4", company: "Microsoft", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "16K", description: "Компактная модель Microsoft. Сильна в логике и математике для своего размера.", strengths: ["Логика", "Математика", "Компактная"] },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", company: "Meta", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "128K", description: "Open-source модель Meta на 70B параметров. Отличное качество по низкой цене.", strengths: ["Open-source", "70B", "128K контекст"] },
  { id: "qwen-turbo", name: "Qwen Turbo", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 0.65, context: "1M", description: "Быстрая модель Alibaba с 1М контекстом. Идеальна для длинных документов.", strengths: ["1M контекст", "Быстрая", "Дешёвая"] },
  { id: "nvidia-nemotron", name: "Nemotron 70B", company: "NVIDIA", tier: "pro", category: "chat", pricePerMillion: 1.0, context: "128K", description: "Модель от NVIDIA. Оптимизирована для inference, хороша в кодинге.", strengths: ["NVIDIA", "Кодинг", "128K"] },
  { id: "mythomax-13b", name: "MythoMax 13B", company: "Gryphe", tier: "pro", category: "chat", pricePerMillion: 0.5, context: "4K", description: "Творческая модель для ролевых игр и сторителлинга. Яркий стиль.", strengths: ["Творческая", "Ролевые игры", "Дешёвая"] },

  // TIER 6: SPECIAL (2 models)
  { id: "perplexity-sonar", name: "Perplexity Sonar", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 4.0, context: "127K", description: "AI поиск с актуальными данными из интернета. Ссылки на источники.", strengths: ["Поиск", "Актуальные данные", "Дешёвая"] },
  { id: "perplexity-sonar-deep", name: "Sonar Deep Research", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 16.8, context: "127K", description: "Глубокое исследование с мультишаговым поиском. Для аналитики и research.", strengths: ["Deep Research", "Мультишаговый", "Аналитика"] },

  // TIER 7: VIDEO GENERATION (13 models)
  // Premium
  { id: "sora-2", name: "Sora 2 Pro", company: "OpenAI", tier: "pro", category: "video", pricePerMillion: 0.50, priceUnit: "/vid", context: "5-10s", description: "Видео-модель от OpenAI. Лучшая физика, сложные сцены, точное следование промптам.", strengths: ["OpenAI", "Физика", "Сложные сцены"] },
  { id: "veo-3", name: "Veo 3.1", company: "Google", tier: "pro", category: "video", pricePerMillion: 0.65, priceUnit: "/vid", context: "5-10s", description: "Видео от Google. Нативное 4K, лучший lip-sync и диалоги, звуковой дизайн.", strengths: ["4K", "Lip-sync", "Звук", "Google"] },
  { id: "runway-gen3", name: "Runway Gen-3", company: "Runway", tier: "pro", category: "video", pricePerMillion: 0.85, priceUnit: "/vid", context: "5-10s", description: "Кинематографическое качество. Индустриальный стандарт для профессионалов.", strengths: ["Кинематографичное", "Профессиональное"] },
  // Mid-range
  { id: "minimax", name: "MiniMax Hailuo", company: "MiniMax", tier: "pro", category: "video", pricePerMillion: 0.28, priceUnit: "/vid", context: "5-10s", description: "Быстрая генерация от MiniMax. Анимация персонажей, плавное движение.", strengths: ["Быстрая", "Персонажи", "Плавное"] },
  { id: "pixverse-v5", name: "PixVerse v5", company: "PixVerse", tier: "pro", category: "video", pricePerMillion: 0.22, priceUnit: "/vid", context: "5-10s", description: "Кинематографичная камера, плавное движение, хороший контроль сцены.", strengths: ["Камера", "Плавное", "Контроль"] },
  { id: "luma-dream", name: "Luma Dream", company: "Luma", tier: "pro", category: "video", pricePerMillion: 0.35, priceUnit: "/vid", context: "5s", description: "Dream Machine от Luma. Реалистичная физика и кинематичные переходы.", strengths: ["Физика", "Переходы", "5с"] },
  { id: "pika-2", name: "Pika 2.0", company: "Pika", tier: "pro", category: "video", pricePerMillion: 0.18, priceUnit: "/vid", context: "3-5s", description: "Самая быстрая генерация (<90 сек). Идеальна для соцсетей и коротких клипов.", strengths: ["Быстрая", "Соцсети", "3-5с"] },
  // Budget
  { id: "wan-2", name: "Wan 2.6", company: "Alibaba", tier: "pro", category: "video", pricePerMillion: 0.15, priceUnit: "/vid", context: "5-10s", description: "Самая дешёвая видео-модель. 1080p, быстрая генерация для массового контента.", strengths: ["Дешёвая", "$0.15", "1080p"] },
  { id: "hunyuan", name: "Hunyuan Video", company: "Tencent", tier: "pro", category: "video", pricePerMillion: 0.18, priceUnit: "/vid", context: "5s", description: "Бюджетная модель от Tencent. Хорошее качество за низкую цену.", strengths: ["Бюджетная", "Tencent", "5с"] },
  { id: "ltx-video", name: "LTX Video 2.3", company: "Lightricks", tier: "pro", category: "video", pricePerMillion: 0.12, priceUnit: "/vid", context: "5s", description: "Самая дешёвая модель. Open source, быстрая, поддержка аудио.", strengths: ["Самая дешёвая", "$0.12", "Open source"] },
  { id: "stable-video", name: "Stable Video", company: "Stability", tier: "pro", category: "video", pricePerMillion: 0.15, priceUnit: "/vid", context: "4s", description: "Стабильное качество от Stability AI. Надёжная и предсказуемая.", strengths: ["Стабильная", "Надёжная", "4с"] },

  // TIER 8: 3D GENERATION (2 models)
  { id: "tripo-v2.5", name: "Tripo v2.5", company: "Tripo3D", tier: "pro", category: "3d", pricePerMillion: 0.60, priceUnit: "/model", context: "25-100s", description: "Text/Image → 3D с PBR текстурами. Высокое качество для игр и визуализации.", strengths: ["PBR текстуры", "Text-to-3D", "Game-ready"] },
  { id: "triposr", name: "TripoSR", company: "Stability", tier: "pro", category: "3d", pricePerMillion: 0.21, priceUnit: "/model", context: "<1s", description: "Image → 3D мгновенно (<1 секунда). Идеален для быстрого прототипирования.", strengths: ["Мгновенная", "Дешёвая", "Прототипы"] },
];

export const COMPANIES = Array.from(new Set(MODELS.map((m) => m.company)));
export const CATEGORIES: ModelCategory[] = ["chat", "image", "reason", "search", "code", "video", "3d"];
