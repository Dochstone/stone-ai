/**
 * Stone AI — Translations for EN / RU / ZH.
 * All UI strings are stored here for centralized i18n.
 */

export type Lang = 'en' | 'ru' | 'zh'

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
  zh: '中文',
}

export type TranslationKeys = typeof translations['en']

export const translations = {
  // ─── ENGLISH ───
  en: {
    // App
    loading: 'Loading...',

    // Bottom nav
    nav_home: 'Home',
    nav_chat: 'Chat',
    nav_plans: 'Plans',
    nav_profile: 'Profile',

    // HomeScreen
    home_subtitle_lite: 'Lite free',
    home_subtitle_premium: 'Premium by subscription',
    home_subtitle: (lite: number, premium: number) =>
      `${lite} Lite free • ${premium} Premium by subscription`,
    home_lite_today: 'Lite today',
    home_premium: 'Premium',
    home_lite_free: 'Lite — free',
    home_per_day: '20/day',
    home_premium_sub: 'Premium — subscription',

    // ChatScreen
    chat_ask: (name: string) => `Ask ${name} a question`,
    chat_free_hint: 'Free, up to 20 requests per day',
    chat_premium_hint: 'Premium model',
    chat_placeholder: 'Message...',

    // PlansScreen
    plans_title: 'Stone AI Plans',
    plans_subtitle: 'Unlock the best AI models in the world',
    plans_active_sub: (plan: string) => `${plan} subscription active`,
    plans_how_title: 'How does it work?',
    plans_how_lite: '— GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral — 20/day',
    plans_how_premium: '— GPT-4.1, Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity',
    plans_tab_subs: 'Subscriptions',
    plans_tab_passes: 'Passes',
    plans_buy: 'Buy',
    plans_buying: 'Loading...',
    plans_ton_soon: 'Soon',
    plans_usdt_soon: 'Soon',
    plans_stars_desc: 'Telegram',
    plans_toast_ton_soon: 'TON/USDT payment coming soon',
    plans_toast_already: (plan: string) => `You already have ${plan} subscription`,
    plans_toast_success: 'Payment successful! Refreshing app.',
    plans_toast_cancelled: 'Payment cancelled',
    plans_toast_error: 'Payment error',
    plans_upsell_title: 'Subscription is cheaper!',
    plans_upsell_desc: 'PLUS for 469⭐/mo = 15.6⭐/day vs Day Pass 59⭐/day',

    // Plans data
    plans_per_month: '/mo',
    plans_premium_day: 'Premium/day',
    plans_savings: 'savings',
    plans_hours: 'hours',
    plans_days: 'days',
    plans_1_query: '1 query',
    plans_1_premium_query: '1 Premium query',

    // ProfileScreen
    profile_total: 'Total',
    profile_lite: 'Lite',
    profile_premium: 'Premium',
    profile_theme: 'Theme',
    profile_language: 'Language',
    profile_app_desc: 'Multi-model AI chatbot',
    profile_models: 'Models',
    profile_models_val: '11 (6 Lite + 5 Premium)',
    profile_payment: 'Payment',
    profile_support: 'Support',
    profile_upgrade: '→ Upgrade',
  },

  // ─── RUSSIAN ───
  ru: {
    loading: 'Загрузка...',

    nav_home: 'Главная',
    nav_chat: 'Чат',
    nav_plans: 'Тарифы',
    nav_profile: 'Профиль',

    home_subtitle_lite: 'Lite бесплатно',
    home_subtitle_premium: 'Premium по подписке',
    home_subtitle: (lite: number, premium: number) =>
      `${lite} Lite бесплатно • ${premium} Premium по подписке`,
    home_lite_today: 'Lite сегодня',
    home_premium: 'Premium',
    home_lite_free: 'Lite — бесплатно',
    home_per_day: '20/день',
    home_premium_sub: 'Premium — подписка',

    chat_ask: (name: string) => `Задай вопрос ${name}`,
    chat_free_hint: 'Бесплатно, до 20 запросов в день',
    chat_premium_hint: 'Premium модель',
    chat_placeholder: 'Сообщение...',

    plans_title: 'Тарифы Stone AI',
    plans_subtitle: 'Разблокируй лучшие AI-модели мира',
    plans_active_sub: (plan: string) => `Активна подписка ${plan}`,
    plans_how_title: 'Как это работает?',
    plans_how_lite: '— GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral — 20/день',
    plans_how_premium: '— GPT-4.1, Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity',
    plans_tab_subs: 'Подписки',
    plans_tab_passes: 'Пассы',
    plans_buy: 'Купить',
    plans_buying: 'Загрузка...',
    plans_ton_soon: 'Скоро',
    plans_usdt_soon: 'Скоро',
    plans_stars_desc: 'Telegram',
    plans_toast_ton_soon: 'Оплата TON/USDT скоро будет доступна',
    plans_toast_already: (plan: string) => `У вас уже активна подписка ${plan}`,
    plans_toast_success: 'Оплата прошла! Обновите приложение.',
    plans_toast_cancelled: 'Оплата отменена',
    plans_toast_error: 'Ошибка оплаты',
    plans_upsell_title: 'Подписка выгоднее!',
    plans_upsell_desc: 'PLUS за 469⭐/мес = 15.6⭐/день vs Day Pass 59⭐/день',

    plans_per_month: '/мес',
    plans_premium_day: 'Premium/день',
    plans_savings: 'экономия',
    plans_hours: 'часа',
    plans_days: 'дней',
    plans_1_query: '1 запрос',
    plans_1_premium_query: '1 Premium запрос',

    profile_total: 'Всего',
    profile_lite: 'Lite',
    profile_premium: 'Premium',
    profile_theme: 'Тема',
    profile_language: 'Язык',
    profile_app_desc: 'Мульти-модельный AI чатбот',
    profile_models: 'Модели',
    profile_models_val: '11 (6 Lite + 5 Premium)',
    profile_payment: 'Оплата',
    profile_support: 'Поддержка',
    profile_upgrade: '→ Улучшить',
  },

  // ─── CHINESE SIMPLIFIED ───
  zh: {
    loading: '加载中...',

    nav_home: '首页',
    nav_chat: '聊天',
    nav_plans: '方案',
    nav_profile: '我的',

    home_subtitle_lite: 'Lite 免费',
    home_subtitle_premium: 'Premium 订阅制',
    home_subtitle: (lite: number, premium: number) =>
      `${lite} 个Lite免费 • ${premium} 个Premium订阅制`,
    home_lite_today: 'Lite 今日',
    home_premium: 'Premium',
    home_lite_free: 'Lite — 免费',
    home_per_day: '20/天',
    home_premium_sub: 'Premium — 订阅',

    chat_ask: (name: string) => `向 ${name} 提问`,
    chat_free_hint: '免费，每天最多20次请求',
    chat_premium_hint: 'Premium 模型',
    chat_placeholder: '输入消息...',

    plans_title: 'Stone AI 方案',
    plans_subtitle: '解锁全球最佳AI模型',
    plans_active_sub: (plan: string) => `${plan} 订阅已激活`,
    plans_how_title: '如何运作？',
    plans_how_lite: '— GPT-4o mini、Haiku、Flash、DeepSeek、Llama、Mistral — 20次/天',
    plans_how_premium: '— GPT-4.1、Opus 4、Grok 3、Gemini 2.5 Pro、Perplexity',
    plans_tab_subs: '订阅',
    plans_tab_passes: '通行证',
    plans_buy: '购买',
    plans_buying: '加载中...',
    plans_ton_soon: '即将推出',
    plans_usdt_soon: '即将推出',
    plans_stars_desc: 'Telegram',
    plans_toast_ton_soon: 'TON/USDT支付即将上线',
    plans_toast_already: (plan: string) => `您已拥有${plan}订阅`,
    plans_toast_success: '支付成功！正在刷新应用。',
    plans_toast_cancelled: '支付已取消',
    plans_toast_error: '支付错误',
    plans_upsell_title: '订阅更划算！',
    plans_upsell_desc: 'PLUS 469⭐/月 = 15.6⭐/天 vs 日通行证 59⭐/天',

    plans_per_month: '/月',
    plans_premium_day: 'Premium/天',
    plans_savings: '节省',
    plans_hours: '小时',
    plans_days: '天',
    plans_1_query: '1次请求',
    plans_1_premium_query: '1次Premium请求',

    profile_total: '总计',
    profile_lite: 'Lite',
    profile_premium: 'Premium',
    profile_theme: '主题',
    profile_language: '语言',
    profile_app_desc: '多模型AI聊天机器人',
    profile_models: '模型',
    profile_models_val: '11 (6个Lite + 5个Premium)',
    profile_payment: '支付方式',
    profile_support: '客服',
    profile_upgrade: '→ 升级',
  },
} as const
