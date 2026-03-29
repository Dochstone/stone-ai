# SEO-анализ Stone AI — Полный отчёт

**Дата:** 21 марта 2026
**Проект:** Stone AI (https://website-production-907e.up.railway.app)

---

## 1. Технический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Фреймворк | Next.js (App Router) | 14.2.21 |
| React | React | 18.3.1 |
| Язык | TypeScript | 5.4.5 |
| Стили | Tailwind CSS | 3.4.4 |
| Шрифт | Manrope (Google Fonts) | 400-800 |
| Деплой | Railway (Docker, standalone) | — |
| Бэкенд | FastAPI + PostgreSQL | Python 3.13 |
| Аналитика | Google Analytics 4 + Яндекс.Метрика | — |

**Зависимости (production):** всего 3 — next, react, react-dom. Минимально, безопасно.

---

## 2. Текущее состояние SEO

### Что реализовано (работает)

| Категория | Статус | Детали |
|-----------|--------|--------|
| Metadata (title/description) | ✅ Есть | На всех 24 страницах, template: `%s \| Stone AI` |
| OpenGraph теги | ✅ Есть | og:title, og:description, og:image (1200x630), og:locale=ru_RU |
| Twitter Card | ✅ Есть | summary_large_image |
| robots.txt | ✅ Есть | Allow: /, ссылка на sitemap |
| sitemap.xml | ✅ Есть | 23 URL, приоритеты 0.3–1.0 |
| Canonical URL | ✅ Есть | В корневом layout |
| JSON-LD (Organization) | ✅ Есть | name, logo, sameAs (Telegram) |
| JSON-LD (WebSite) | ✅ Есть | SearchAction для /models |
| JSON-LD (SoftwareApplication) | ✅ Есть | rating 4.8, price: free |
| JSON-LD (ItemList) | ✅ Есть | На /models — 57 моделей |
| JSON-LD (Product) | ✅ Есть | На /pricing — тарифы |
| Тёмная тема | ✅ Есть | CSS variables, class-based toggle |
| Контрастность | ✅ WCAG AAA | Light ~20:1, Dark ~15:1 |
| Accessibility | ✅ Базовая | Skip-link, focus rings, semantic HTML, reduced-motion |
| SSG для блога | ✅ Есть | generateStaticParams() — 3 статьи |
| Breadcrumbs (компонент) | ✅ Есть | Nav-элемент с ol |
| Шрифт оптимизация | ✅ Есть | next/font/google, CSS variable |

### Что отсутствует (проблемы)

| Категория | Статус | Влияние |
|-----------|--------|---------|
| next/image | ❌ Нет | Нет оптимизации изображений (WebP, lazy load, srcset) |
| PWA (manifest.json) | ❌ Нет | Не установить как приложение |
| Service Worker | ❌ Нет | Нет офлайн-режима |
| i18n / мультиязычность | ❌ Нет | Только RU, нет hreflang |
| Кеширование (headers) | ❌ Нет | Не настроены Cache-Control в next.config |
| ISR (Incremental Static) | ❌ Нет | Блог требует полного ребилда |
| FAQ Schema (FAQPage) | ❌ Нет | Есть FAQ-компоненты, но без JSON-LD |
| BreadcrumbList Schema | ❌ Нет | Есть визуальные хлебные крошки, но без JSON-LD |
| Web Vitals мониторинг | ❌ Нет | Нет отслеживания CLS/LCP/FID |
| Error boundary | ❌ Нет | Нет error.tsx |
| Тесты | ❌ Нет | Нет Jest/Vitest/E2E |

---

## 3. Карта страниц (24 маршрута)

### Маркетинговые страницы

| Маршрут | Metadata | Рендеринг | JSON-LD | Приоритет sitemap |
|---------|----------|-----------|---------|-------------------|
| `/` | По умолчанию | SSR | — | 1.0 |
| `/models` | ✅ "Все 50 AI-моделей" | SSR | ItemList | 0.9 |
| `/pricing` | ✅ "Цены" | SSR | Product | 0.8 |
| `/chat` | ✅ "AI Чат" | SSR | — | 0.8 |
| `/images` | ✅ + OG | SSR | — | 0.8 |
| `/video` | ✅ + JSON-LD | SSR | SoftwareApp | 0.8 |
| `/audio` | ✅ | SSR | — | 0.8 |
| `/3d` | ✅ | SSR | — | 0.8 |
| `/documents` | ✅ | SSR | — | 0.8 |
| `/search` | ✅ | SSR | — | 0.8 |
| `/code` | ✅ | SSR | — | 0.8 |
| `/translate` | ✅ | SSR | — | 0.8 |

### Контентные страницы

| Маршрут | Metadata | Рендеринг | Приоритет |
|---------|----------|-----------|-----------|
| `/blog` | ✅ "Блог" | SSR | 0.7 |
| `/blog/stone-ai-vs-chatgpt-plus` | ✅ Dynamic | **SSG** | 0.7 |
| `/blog/guide-50-ai-models` | ✅ Dynamic | **SSG** | 0.7 |
| `/blog/4-ways-to-pay-ai-russia` | ✅ Dynamic | **SSG** | 0.7 |
| `/docs` | ✅ | SSR | 0.5 |

### Служебные страницы

| Маршрут | Metadata | Индексация |
|---------|----------|------------|
| `/webchat` | ✅ | Да (0.9) |
| `/profile` | ✅ | Да (0.4) |
| `/referral` | ✅ | Да (0.5) |
| `/topup` | ✅ | Да (0.5) |
| `/terms` | ✅ | Да (0.3) |
| `/privacy` | ✅ | Да (0.3) |
| `/refund` | ✅ | Да (0.3) |
| `/auth/google/callback` | Нет | Нет (не в sitemap) |
| `/auth/yandex/callback` | Нет | Нет (не в sitemap) |

---

## 4. Структурированные данные (JSON-LD)

### Глобальные (layout.tsx)

```
Organization → Stone AI, logo, Telegram-ссылки
WebSite     → SearchAction → /models?q={query}
SoftwareApp → Telegram, бесплатно, рейтинг 4.8/5 (150 оценок)
```

### На отдельных страницах

```
/models  → ItemList (57 моделей, top-3 с ссылками)
/pricing → Product (Free tier + Per-token tier)
/video   → SoftwareApplication (MultimediaApp, $0.15)
```

### Отсутствующие схемы (рекомендация)

```
FAQPage         → для /models, /pricing, tool-страниц (есть FAQ-компоненты)
BreadcrumbList  → для всех внутренних страниц (есть визуальный компонент)
Article         → для /blog/[slug] (частично есть через OG type=article)
HowTo           → для /docs
```

---

## 5. Конфигурация

### next.config.mjs (текущая)

```javascript
const nextConfig = {
  output: "standalone",
};
// Больше ничего — нет оптимизаций
```

### robots.txt

```
User-agent: *
Allow: /
Sitemap: https://website-production-907e.up.railway.app/sitemap.xml
```

### Цветовая система

```
Light:  bg #FAF9F5 / text #1A1916 / accent #D97757
Dark:   bg #0C0C10 / text #F0EDE8 / accent #D97757
Teal:   #0E9A83
```

---

## 6. Компоненты (37 шт.)

| Группа | Файлы |
|--------|-------|
| Навигация | Nav, Footer, ScrollToTop, Breadcrumbs, Providers |
| Hero/Маркетинг | Hero, PromoBanner, ToolPageHero, ProductScreenshot, DemoShowcase, Reviews, CtaSection |
| Каталог моделей | ModelGrid, ModelCatalog, ModelTicker, ToolCards, FeaturesTable |
| Ценообразование | PricingCalculator, PricingComparison, Pricing, PricingTable, HowItWorks |
| Tool-страницы | ToolModels, ToolExamples, ToolFaq, ToolCta, FAQ |
| Профиль/Формы | ProfilePage, ReferralPage, TopUpPage, AuthForm, ThemeToggle |
| Чат | WebChat (1400+ строк), WebChatWrapper |
| Утилиты | CodeBlock, Toast, Onboarding |

---

## 7. Аналитика

| Сервис | Переменная окружения | Фичи |
|--------|---------------------|-------|
| Google Analytics 4 | `NEXT_PUBLIC_GA_ID` | Стандартный gtag.js |
| Яндекс.Метрика | `NEXT_PUBLIC_YM_ID` | Вебвизор, карта кликов, точный отказ |

Оба условные — загружаются только при наличии env-переменной.

---

## 8. SEO-оценка по категориям

| Категория | Оценка | Комментарий |
|-----------|--------|-------------|
| Метаданные | 9/10 | Полные, структурированные, template |
| Структурированные данные | 8/10 | 6 схем, не хватает FAQPage и BreadcrumbList |
| Техническое SEO | 8/10 | sitemap, robots, canonical, SSL |
| Производительность | 6/10 | Нет next/image, нет кеш-заголовков |
| Доступность | 7/10 | Skip-link, контраст AAA, нет полных ARIA |
| Мультиязычность | 1/10 | Только RU |
| PWA | 2/10 | Нет manifest, нет offline |
| Контент | 8/10 | 24 страницы, 3 статьи, 57 моделей |
| Аналитика | 8/10 | GA4 + Метрика, нет event tracking |
| **Общий балл** | **7.1/10** | Крепкий фундамент, есть точки роста |

---

## 9. Приоритетные рекомендации

### Высокий приоритет

1. **Внедрить next/image** — автоматическая оптимизация (WebP, lazy load, srcset)
2. **Настроить кеширование** — добавить headers в next.config.mjs для статики
3. **Добавить FAQPage JSON-LD** — на страницах с FAQ-компонентами
4. **Добавить BreadcrumbList JSON-LD** — уже есть визуальный компонент
5. **Блокировать /auth/* в robots.txt** — не нужно индексировать callback'и

### Средний приоритет

6. **Внедрить ISR для блога** — revalidate вместо полного ребилда
7. **Добавить Web Vitals** — мониторинг CLS, LCP, FID
8. **Создать manifest.json** — для PWA-установки
9. **Добавить canonical на каждую страницу** — сейчас только глобальный
10. **Динамическая генерация sitemap** — вместо статического файла

### Низкий приоритет

11. **i18n** — английская версия для расширения аудитории
12. **error.tsx** — кастомные страницы ошибок
13. **E2E тесты** — для критических путей (авторизация, оплата)
14. **Structured data для аудио/3D** — дополнительные схемы

---

## 10. Переменные окружения (полный список)

### Backend (22 шт.)

```
BOT_TOKEN, WEBAPP_URL, OPENROUTER_API_KEY, DATABASE_URL, SECRET_KEY,
TON_WALLET_ADDRESS, TONAPI_KEY, LAVA_SECRET_KEY, LAVA_SHOP_ID,
LAVA_WEBHOOK_KEY, HELEKET_API_KEY, HELEKET_MERCHANT, CRYPTOBOT_API_TOKEN,
FAL_API_KEY, OPENAI_API_KEY, ADMIN_TG_IDS, GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, ADSGRAM_BLOCK_ID
```

### Frontend (5 шт.)

```
NEXT_PUBLIC_API_URL=https://stone-ai-production.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
NEXT_PUBLIC_YANDEX_CLIENT_ID=<Yandex OAuth Client ID>
NEXT_PUBLIC_GA_ID=<Google Analytics 4 ID>
NEXT_PUBLIC_YM_ID=<Яндекс.Метрика ID>
```

---

*Документ сгенерирован автоматически на основе анализа кодовой базы Stone AI.*
