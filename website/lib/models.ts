export type ModelTier = "free" | "pro";
export type ModelCategory = "chat" | "image" | "reason" | "search" | "code" | "video" | "3d";

export interface AIModel {
  id: string;
  name: string;
  company: string;
  tier: ModelTier;
  category: ModelCategory;
  pricePerMillion?: number; // internal only, not shown to users
  priceUnit?: string; // internal only
  context: string;
  description?: string;
  strengths?: string[];
  speed?: string;
}

export const TELEGRAM_BOT_URL = "https://t.me/drifttt55bot";

export const MODELS: AIModel[] = [
  // TIER 1: FREE (8 models)
  { id: "gpt-4o-mini", name: "GPT-4o mini", company: "OpenAI", tier: "free", category: "chat", context: "128K", speed: "fast", description: "Быстрая модель OpenAI. Идеальна для простых задач, переводов и быстрых ответов.", strengths: ["Быстрая", "Бесплатная", "128K контекст"] },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", company: "Anthropic", tier: "free", category: "chat", context: "200K", speed: "fast", description: "Быстрый Claude для ежедневных задач. Отличный баланс скорости и качества с 200К контекстом.", strengths: ["200K контекст", "Бесплатная", "Быстрая"] },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", company: "Google", tier: "free", category: "chat", context: "1M", speed: "instant", description: "Молниеносная модель Google с контекстом 1 миллион токенов. Мгновенные ответы.", strengths: ["1M контекст", "Бесплатная", "Мгновенная"] },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", company: "Meta", tier: "free", category: "chat", context: "1M", speed: "fast", description: "Open-source модель от Meta. Быстрая, с контекстом 1М. Хороша для творческих задач.", strengths: ["Open-source", "1M контекст", "Бесплатная"] },
  { id: "mistral-large-25", name: "Mistral Large", company: "Mistral", tier: "free", category: "chat", context: "128K", speed: "medium", description: "Мощная европейская модель. Сильна в мультиязычности и структурированных задачах.", strengths: ["Мультиязычная", "128K контекст", "Бесплатная"] },

  // TIER 2: MID (15 models)
  { id: "deepseek-r1", name: "DeepSeek R1", company: "DeepSeek", tier: "pro", category: "chat", context: "164K", speed: "medium", description: "Показывает ход мыслей. Конкурент o3 по качеству reasoning. Открытая архитектура.", strengths: ["Ход мыслей", "Reasoning", "Open-source"] },
  { id: "deepseek-v3", name: "DeepSeek V3", company: "DeepSeek", tier: "free", category: "chat", context: "128K", speed: "fast", description: "Универсальная модель DeepSeek. Отличный баланс скорости и качества для повседневных задач.", strengths: ["Быстрая", "Универсальная", "128K", "Бесплатная"] },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", company: "DeepSeek", tier: "pro", category: "chat", context: "128K", speed: "fast", description: "Обновлённая версия V3. Улучшенный кодинг и следование инструкциям.", strengths: ["Кодинг", "Быстрая", "Обновлённая"] },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", company: "OpenAI", tier: "pro", category: "chat", context: "1M", speed: "fast", description: "Компактная модель OpenAI с контекстом 1M. Быстрая, хороша для кода.", strengths: ["1M контекст", "Кодинг", "Быстрая"] },
  { id: "gpt-4.1-nano", name: "GPT-4.1 nano", company: "OpenAI", tier: "pro", category: "chat", context: "1M", speed: "instant", description: "Самая быстрая модель OpenAI. Мгновенные ответы с 1M контекстом.", strengths: ["Мгновенная", "1M контекст", "Лёгкая"] },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", company: "Google", tier: "pro", category: "chat", context: "1M", speed: "fast", description: "Быстрая модель Google нового поколения. 1М контекст, отличный кодинг.", strengths: ["1M контекст", "Быстрая", "Кодинг"] },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", company: "Anthropic", tier: "pro", category: "chat", context: "200K", speed: "medium", description: "Сбалансированная модель Anthropic. Отличное качество для анализа, текстов и кода.", strengths: ["Анализ", "Кодинг", "200K контекст"] },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", company: "Anthropic", tier: "pro", category: "chat", context: "200K", speed: "medium", description: "Улучшенный Sonnet с лучшим следованием инструкциям и творческими способностями.", strengths: ["Творчество", "Точность", "200K контекст"] },
  { id: "grok-3-mini", name: "Grok 3 mini", company: "xAI", tier: "pro", category: "chat", context: "131K", speed: "fast", description: "Компактный Grok от xAI. Прямые ответы, хороший юмор, быстрая скорость.", strengths: ["Быстрая", "Прямые ответы", "131K"] },
  { id: "qwen-3-235b", name: "Qwen 3 235B", company: "Alibaba", tier: "pro", category: "chat", context: "40K", speed: "medium", description: "Мощная модель от Alibaba. 235 миллиардов параметров, сильна в логике.", strengths: ["235B параметров", "Логика", "Мощная"] },
  { id: "qwen-qwq", name: "Qwen QwQ 32B", company: "Alibaba", tier: "pro", category: "chat", context: "131K", speed: "medium", description: "Reasoning-модель от Alibaba. Показывает ход мыслей, хороша для математики.", strengths: ["Reasoning", "Математика", "131K"] },
  { id: "minimax-m2.5", name: "MiniMax M2.5", company: "MiniMax", tier: "pro", category: "chat", context: "1M", speed: "fast", description: "Модель с 1М контекстом. Сильна в длинных документах и анализе.", strengths: ["1M контекст", "Документы", "Быстрая"] },

  { id: "command-r7", name: "Command R7", company: "Cohere", tier: "pro", category: "chat", context: "128K", speed: "instant", description: "Специализированная модель для RAG и работы с документами. Мгновенные ответы.", strengths: ["Мгновенная", "RAG", "Документы"] },
  { id: "mistral-small", name: "Mistral Small", company: "Mistral", tier: "pro", category: "chat", context: "32K", speed: "fast", description: "Компактная европейская модель. Быстрая, хороша для классификации и саммари.", strengths: ["Быстрая", "Саммари", "Классификация"] },

  // TIER 3: PREMIUM (15 models)
  { id: "claude-opus-4", name: "Claude Opus 4", company: "Anthropic", tier: "pro", category: "chat", context: "200K", speed: "slow", description: "Флагман Anthropic — лучший для текстового анализа и творчества. 200К контекст, глубокое понимание нюансов.", strengths: ["Текстовый анализ", "Творчество", "200K контекст"] },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5", company: "Anthropic", tier: "pro", category: "chat", context: "200K", speed: "slow", description: "Обновлённый Opus с улучшенным кодингом и мультимодальностью.", strengths: ["Кодинг", "Мультимодальность", "200K"] },
  { id: "gpt-4.1", name: "GPT-4.1", company: "OpenAI", tier: "pro", category: "chat", context: "1M", speed: "medium", description: "Мощная модель OpenAI с 1М контекстом. Отличный кодинг и длинные документы.", strengths: ["1M контекст", "Кодинг", "Документы"] },
  { id: "gpt-5.1", name: "GPT-5.1", company: "OpenAI", tier: "pro", category: "chat", context: "400K", speed: "medium", description: "Флагман OpenAI. Отличное качество для сложных задач и глубокого анализа.", strengths: ["Флагман", "400K контекст", "Сложные задачи"] },
  { id: "gpt-5.4", name: "GPT-5.4", company: "OpenAI", tier: "pro", category: "chat", context: "1M", speed: "medium", description: "Новейшая модель OpenAI с контекстом 1М токенов. Объединяет Codex и GPT. Встроенное управление компьютером.", strengths: ["1M контекст", "Computer Use", "Codex внутри"] },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", company: "Google", tier: "pro", category: "chat", context: "1M", speed: "medium", description: "Топовая модель Google с 1М контекстом. Лучшая в работе с таблицами, данными и мультимодальными задачами.", strengths: ["1M контекст", "Таблицы и данные", "Мультимодальная"] },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", company: "Google", tier: "pro", category: "chat", context: "1M", speed: "medium", description: "Новейшая модель Google третьего поколения. Улучшенное рассуждение и кодинг.", strengths: ["Новейшая", "1M контекст", "Рассуждение"] },
  { id: "grok-3", name: "Grok 3", company: "xAI", tier: "pro", category: "chat", context: "131K", speed: "medium", description: "Модель xAI Илона Маска. Без цензуры, прямые ответы, данные из X (Twitter) в реальном времени.", strengths: ["Без цензуры", "Данные из X", "Прямые ответы"] },
  { id: "perplexity-sonar-pro", name: "Perplexity Pro", company: "Perplexity", tier: "pro", category: "search", context: "200K", speed: "medium", description: "Премиум поиск с актуальными данными из интернета. Ссылки на источники.", strengths: ["Поиск в интернете", "Актуальные данные", "Источники"] },
  { id: "kimi-k2.5", name: "Kimi K2.5", company: "Moonshot", tier: "pro", category: "chat", context: "128K", speed: "medium", description: "Модель от Moonshot AI. Хороша для длинных документов и анализа.", strengths: ["Документы", "Анализ", "128K"] },
  { id: "o4-mini", name: "o4-mini", company: "OpenAI", tier: "pro", category: "reason", context: "200K", speed: "slow", description: "Компактная reasoning-модель OpenAI. Пошаговое рассуждение для логики и математики.", strengths: ["Reasoning", "Математика", "Логика"] },
  { id: "o3", name: "o3", company: "OpenAI", tier: "pro", category: "reason", context: "200K", speed: "slow", description: "Мощная reasoning-модель OpenAI. Глубокое рассуждение для самых сложных задач.", strengths: ["Глубокий reasoning", "Сложные задачи", "200K"] },
  { id: "claude-haiku-4.5-think", name: "Claude Haiku Think", company: "Anthropic", tier: "pro", category: "reason", context: "200K", speed: "medium", description: "Claude Haiku с расширенным мышлением. Быстрый reasoning с 200K контекстом.", strengths: ["Reasoning", "Быстрый", "200K контекст"] },
  { id: "gemini-2.5-flash-think", name: "Gemini Flash Think", company: "Google", tier: "pro", category: "reason", context: "1M", speed: "fast", description: "Gemini Flash с пошаговым рассуждением и 1М контекстом.", strengths: ["1M контекст", "Reasoning", "Быстрая"] },
  { id: "devstral", name: "Devstral", company: "Mistral", tier: "pro", category: "code", context: "128K", speed: "fast", description: "Специализированная модель для кода от Mistral. Рефакторинг, дебаг, генерация на любом языке.", strengths: ["Код-специалист", "Быстрая", "Все языки"] },

  // TIER 4: IMAGE (4 models)
  { id: "nano-banana-pro", name: "Nano Banana Pro", company: "Google", tier: "pro", category: "image", context: "65K", speed: "medium", description: "Фотореалистичные изображения 4K от Google. Текст на картинках, редактирование фото, студийное качество.", strengths: ["Фотореализм 4K", "Текст на картинках", "Редактирование"] },
  { id: "nano-banana", name: "Nano Banana", company: "Google", tier: "free", category: "image", context: "1M", speed: "fast", description: "Быстрая генерация картинок от Google. Хорошее качество для любых изображений.", strengths: ["Бесплатная", "Быстрая", "1M контекст"] },
  { id: "gpt-5-image", name: "GPT-5 Image", company: "OpenAI", tier: "pro", category: "image", context: "128K", speed: "medium", description: "Генерация изображений от OpenAI. Высокая детализация и точное следование промпту.", strengths: ["Детализация", "Точность", "OpenAI качество"] },
  { id: "gpt-5-image-mini", name: "GPT-5 Image Mini", company: "OpenAI", tier: "pro", category: "image", context: "128K", speed: "fast", description: "Быстрая генерация от OpenAI. Хороша для набросков и концептов.", strengths: ["Быстрая", "Концепты", "Лёгкая"] },

  // TIER 5: FREE on OpenRouter (7 models)
  { id: "gemma-3-27b", name: "Gemma 3 27B", company: "Google", tier: "pro", category: "chat", context: "96K", speed: "fast", description: "Компактная open-source модель Google. 27B параметров, хороша для быстрых задач.", strengths: ["Open-source", "Быстрая", "96K"] },
  { id: "gemma-3n-4b", name: "Gemma 3n 4B", company: "Google", tier: "pro", category: "chat", context: "32K", speed: "instant", description: "Ультракомпактная модель Google. 4B параметров, мгновенные ответы.", strengths: ["Ультралёгкая", "Мгновенная", "Компактная"] },
  { id: "phi-4", name: "Phi-4", company: "Microsoft", tier: "pro", category: "chat", context: "16K", speed: "fast", description: "Компактная модель Microsoft. Сильна в логике и математике для своего размера.", strengths: ["Логика", "Математика", "Компактная"] },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", company: "Meta", tier: "pro", category: "chat", context: "128K", speed: "medium", description: "Open-source модель Meta на 70B параметров. Отличное качество для широкого спектра задач.", strengths: ["Open-source", "70B", "128K контекст"] },
  { id: "qwen-turbo", name: "Qwen Turbo", company: "Alibaba", tier: "pro", category: "chat", context: "1M", speed: "fast", description: "Быстрая модель Alibaba с 1М контекстом. Идеальна для длинных документов.", strengths: ["1M контекст", "Быстрая", "Документы"] },
  { id: "nvidia-nemotron", name: "Nemotron 70B", company: "NVIDIA", tier: "pro", category: "chat", context: "128K", speed: "medium", description: "Модель от NVIDIA. Оптимизирована для быстрого inference, хороша в кодинге.", strengths: ["NVIDIA", "Кодинг", "128K"] },
  { id: "mythomax-13b", name: "MythoMax 13B", company: "Gryphe", tier: "pro", category: "chat", context: "4K", speed: "instant", description: "Творческая модель для ролевых игр и сторителлинга. Яркий стиль.", strengths: ["Творческая", "Ролевые игры", "Мгновенная"] },

  // TIER 6: SPECIAL (2 models)
  { id: "perplexity-sonar", name: "Perplexity Sonar", company: "Perplexity", tier: "pro", category: "search", context: "127K", speed: "fast", description: "AI поиск с актуальными данными из интернета. Ссылки на источники.", strengths: ["Поиск", "Актуальные данные", "Быстрый"] },
  { id: "perplexity-sonar-deep", name: "Sonar Deep Research", company: "Perplexity", tier: "pro", category: "search", context: "127K", speed: "slow", description: "Глубокое исследование с мультишаговым поиском. Для аналитики и research.", strengths: ["Deep Research", "Мультишаговый", "Аналитика"] },

  // TIER 7: VIDEO GENERATION (12 models)
  { id: "sora-2", name: "Sora 2 Pro", company: "OpenAI", tier: "pro", category: "video", context: "5-10s", speed: "slow", description: "Видео-модель от OpenAI. Лучшая физика, сложные сцены, точное следование промптам.", strengths: ["OpenAI", "Физика", "Сложные сцены"] },
  { id: "veo-3", name: "Veo 3.1", company: "Google", tier: "pro", category: "video", context: "5-10s", speed: "medium", description: "Видео от Google. Нативное 4K, лучший lip-sync и диалоги, звуковой дизайн.", strengths: ["4K", "Lip-sync", "Звук"] },
  { id: "luma-ray2", name: "Luma Ray 2", company: "Luma", tier: "pro", category: "video", context: "5-10s", speed: "medium", description: "Новейшая модель от Luma. Кинематографичное качество, отличная физика и детализация.", strengths: ["Топ качество", "Физика", "Кинематографичное"] },
  { id: "luma-ray2-flash", name: "Ray 2 Flash", company: "Luma", tier: "pro", category: "video", context: "5s", speed: "fast", description: "Быстрая версия Ray 2. Хорошее качество за секунды.", strengths: ["Быстрая", "Качественная", "5с"] },
  { id: "minimax", name: "MiniMax Hailuo", company: "MiniMax", tier: "pro", category: "video", context: "5-10s", speed: "fast", description: "Быстрая генерация от MiniMax. Анимация персонажей, плавное движение.", strengths: ["Быстрая", "Персонажи", "Плавное"] },
  { id: "pixverse-v5", name: "PixVerse v5", company: "PixVerse", tier: "pro", category: "video", context: "5-10s", speed: "medium", description: "Кинематографичная камера, плавное движение, хороший контроль сцены.", strengths: ["Камера", "Плавное", "Контроль"] },
  { id: "luma-dream", name: "Luma Dream", company: "Luma", tier: "pro", category: "video", context: "5s", speed: "medium", description: "Dream Machine от Luma. Реалистичная физика и кинематичные переходы.", strengths: ["Физика", "Переходы", "5с"] },
  { id: "pika-2", name: "Pika 2.0", company: "Pika", tier: "pro", category: "video", context: "3-5s", speed: "fast", description: "Самая быстрая генерация (<90 сек). Идеальна для соцсетей и коротких клипов.", strengths: ["Самая быстрая", "Соцсети", "3-5с"] },
  { id: "ltx-video", name: "LTX Video 2.3", company: "Lightricks", tier: "pro", category: "video", context: "5s", speed: "fast", description: "Open source видео-модель. Быстрая генерация с поддержкой аудио.", strengths: ["Быстрая", "Open source", "Аудио"] },
  { id: "cogvideox", name: "CogVideoX", company: "Zhipu", tier: "pro", category: "video", context: "5s", speed: "medium", description: "Модель от Zhipu AI. Хорошая детализация и плавные движения.", strengths: ["Детализация", "Плавное", "Качественная"] },
  { id: "mochi", name: "Mochi 1", company: "Genmo", tier: "pro", category: "video", context: "5s", speed: "medium", description: "Open source модель от Genmo. Стилизованные и креативные видео.", strengths: ["Open source", "Креативная", "Стилизация"] },
  { id: "stable-video", name: "Stable Video", company: "Stability", tier: "pro", category: "video", context: "4s", speed: "medium", description: "Стабильное качество от Stability AI. Надёжная и предсказуемая.", strengths: ["Стабильная", "Надёжная", "4с"] },

  // TIER 8: 3D GENERATION (2 models)
  { id: "tripo-v2.5", name: "Tripo v2.5", company: "Tripo3D", tier: "pro", category: "3d", context: "25-100s", speed: "slow", description: "Text/Image → 3D с PBR текстурами. Высокое качество для игр и визуализации.", strengths: ["PBR текстуры", "Text-to-3D", "Game-ready"] },
  { id: "triposr", name: "TripoSR", company: "Stability", tier: "pro", category: "3d", context: "<1s", speed: "instant", description: "Image → 3D мгновенно (<1 секунда). Идеален для быстрого прототипирования.", strengths: ["Мгновенная", "Прототипы", "Лёгкая"] },
];

export const COMPANIES = Array.from(new Set(MODELS.map((m) => m.company)));
export const CATEGORIES: ModelCategory[] = ["chat", "image", "reason", "search", "code", "video", "3d"];
