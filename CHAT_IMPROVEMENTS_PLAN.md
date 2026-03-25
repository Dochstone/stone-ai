# Stone AI — Общий план работ

**Обновлено:** 23 марта 2026

---

## 1. Бэкенд — подписки и лимиты

| Задача | Статус |
|--------|--------|
| User model — поля подписки, streak, лимиты | ✅ |
| database.py — миграция новых полей | ✅ |
| subscription.py — PLANS, CREDIT_COSTS, FREE/MINI/FULL модели | ✅ |
| limiter.py — FREE_MODELS, FREE_LIMITS, model_locked логика | ✅ |
| streak.py — бонусы за 2/7/30 дней | ✅ |
| promo.py — промокоды (STONE7, WELCOME, MAXFREE, BONUS500, BLOGSTONE) | ✅ |
| chat.py — model_locked 403, задержка free, per-token billing | ✅ |
| user.py — /api/user/me, /limits, /plans, /subscribe, /promo, /referral | ✅ |
| auth.py — streak + anti-abuse + IP | ✅ |
| chats.py — PATCH endpoint для переименования чатов | ✅ |
| admin.py — CRUD промокодов, статистика рефералов | ✅ |
| Email proxy на VPS (Flask, порт 5050) | ✅ |

## 2. Фронтенд — веб-чат (WebChat.tsx)

| Задача | Статус |
|--------|--------|
| Кастомный dropdown моделей с поиском | ✅ |
| Замочки на моделях + модалка апсейла | ✅ |
| Прогресс-бар лимитов + streak | ✅ |
| Голосовой ввод (Speech API + Whisper fallback) | ✅ |
| Голосовой вывод (Web Speech API) | ✅ |
| Категории моделей (табы: Все/Текст/Картинки/Видео/3D) | ✅ |
| Deep link на модель (?model=X) | ✅ |
| Кнопка "Копировать" на ответах | ✅ |
| Кнопка "Повторить" (regenerate) | ✅ |
| Поиск по чатам в сайдбаре | ✅ |
| Шаблоны промптов (50+ в 7 категориях) | ✅ |
| **Сравнение моделей (1 промпт → 2-3 модели)** | ✅ |
| **Drag & drop файлов в чат** | ✅ |
| **Переименование чатов (double-click в сайдбаре)** | ✅ |
| **Thinking-индикатор (reasoning модели)** | ✅ |
| **Мигающий курсор при стриминге** | ✅ |
| **Горячие клавиши (Ctrl+N, Ctrl+/, Ctrl+Shift+S)** | ✅ |
| **16 dark mode фиксов (bg-white → bg-bg)** | ✅ |
| Закрепить чат (pin) | ⬜ |
| Поделиться чатом (публичная ссылка) | ⬜ |
| Счётчик символов в поле ввода | ⬜ |
| Папки для чатов | ⬜ |
| Canvas режим (редактирование текста в отдельном окне) | ⬜ |

## 3. Фронтенд — сайт и страницы

| Задача | Статус |
|--------|--------|
| Pricing — 4 карточки (Free/Mini/Max/Max Pro) + оплата | ✅ |
| Profile — табы, подписка вместо баланса | ✅ |
| Nav — STONE расшифровка, бургер меню | ✅ |
| Footer — STONE branding | ✅ |
| Blog — 10 статей переписаны под подписки | ✅ |
| Admin — 5 табов (Stats/Users/Transactions/Promos/Referrals) | ✅ |
| Лендинг — bento grid, trust marquee, demo showcase | ✅ |
| Тёмная тема (CSS variables + toggle) | ✅ |
| Модели — 57 описаний + раскрывающиеся карточки | ✅ |
| SEO — meta, OG, sitemap, robots.txt | ✅ |
| Domain stoneai.ru + SSL + Nginx | ✅ |
| Google Search Console + Yandex Webmaster | ✅ |
| Yandex Metrika + Google Analytics | ✅ |

## 4. Инфраструктура

| Задача | Статус |
|--------|--------|
| Backend на Railway | ✅ |
| Website на Railway | ✅ |
| PostgreSQL на Railway | ✅ |
| VPS Beget (Москва) — email proxy | ✅ |
| Домен stoneai.ru (Beget) | ✅ |
| SSH ключи для деплоя | ✅ |
| .gitignore (node_modules, .next, __pycache__) | ⬜ нужно почистить |

## 5. Маркетинг — НЕ НАЧАТО

| Задача | Статус |
|--------|--------|
| Статья на vc.ru | ⬜ |
| Telegram-канал Stone AI | ⬜ |
| Яндекс.Директ — рекламная кампания | ⬜ |
| Анализ конкурентов (7 CIS платформ) | ✅ отчёт готов |
| Внедрить фишки из анализа конкурентов | ⬜ ждёт решения |

## 6. Из анализа конкурентов — кандидаты на внедрение

*(по результатам анализа BotHub, EpicAI, MashaGPT, VibeMarketolog, GPTunnel, ChadAI, SyntxAI)*

| Фишка | Источник | Приоритет | Статус |
|-------|----------|-----------|--------|
| Ежедневный бонус токенов (Daily bonus) | EpicAI | Высокий | ⬜ |
| Provider pill chips (OpenAI/Google/Meta) | MashaGPT | Средний | ⬜ |
| Apple-card bento grid на лендинге | VibeMarketolog | Средний | ⬜ |
| Анимированная CTA кнопка | ChadAI | Средний | ⬜ |
| Canvas/IDE режим | MashaGPT | Низкий | ⬜ |
| Мульти-модель response comparison | VibeMarketolog | — | ✅ сделано |

## 7. Оплата — интеграция

| Задача | Статус |
|--------|--------|
| Stars (Telegram) | ✅ |
| TON Connect | ✅ |
| Карты/СБП — нужна новая интеграция (Lava убрана) | ⬜ |
| Crypto (Heleket) | ✅ |

---

## Следующие шаги (приоритет)

1. Изучить отчёт конкурентов → выбрать фишки для внедрения
2. Починить .gitignore (убрать .next/, node_modules из untracked)
3. Интеграция оплаты картами (замена Lava)
4. Маркетинг: статья vc.ru, Telegram-канал, Яндекс.Директ
5. Chat polish: pin чатов, share чата, папки
