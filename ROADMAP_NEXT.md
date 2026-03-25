# Stone AI — Roadmap & Execution Plan

> Положить в корень проекта. Claude Code читает этот файл и выполняет задачи по порядку.
> Команда для Claude Code: "Прочитай ROADMAP_NEXT.md и выполни следующую незавершённую задачу."

---

## Статус задач

| # | Задача | Статус | Приоритет |
|---|--------|--------|-----------|
| 1 | Видео-генерация | ✅ DONE | — |
| 2 | 3D-генерация | ✅ DONE | — |
| 3 | Аудио (TTS + STT) | ✅ DONE | — |
| 4 | Страницы модулей + линковка | ✅ DONE | — |
| 5 | Сортировка моделей в чате | ✅ DONE | — |
| 6 | Deep link на модель | ✅ DONE | — |
| 7 | Подробные описания моделей + /models переработка | ✅ DONE | — |
| 8 | Уникальные тексты + карточки + графика | ✅ DONE | — |
| 9 | Раскрытие моделей + Hero + Nav чистка | ✅ DONE | — |
| 10 | Цены новых моделей + категории в чате | ✅ DONE | — |
| 11 | Демо-контент: видео/фото заставки | ✅ DONE | — |
| 12 | Тёмная тема сайта | ⬜ TODO | 🟡 Следующий |
| 13 | Ребренд (новое название) | ⬜ TODO | 🟡 Следующий |
| 14 | WhatsApp интеграция | ⬜ TODO | 🟠 Позже |
| 15 | WeChat интеграция | ⬜ TODO | ⚪ Будущее |

---

## 4. Страницы модулей + линковка с главной

### Статус: ⬜ TODO

### Что сделать

#### 4.1 Создать страницы для каждого модуля
Каждая страница — отдельный лендинг инструмента (как у chatbotai.co):

- `website/app/video/page.tsx` — AI Видео
  - Hero: "AI Генерация видео — из текста и фото в видео за секунды"
  - Модели: Kling v2, Runway Gen-3, Pika 2.0, Stable Video, Luma
  - Цены: от $0.15 до $0.75 за видео
  - 3 примера использования: промо-ролик, анимация фото, визуализация идеи
  - CTA: "Попробовать" → /webchat?category=video

- `website/app/audio/page.tsx` — AI Аудио
  - Hero: "Озвучка текста и голосовой ввод — 10+ голосов, мгновенно"
  - Возможности: TTS (текст→речь), STT (речь→текст), 10+ голосов
  - Цены: от $0.01 за предложение
  - 3 примера: озвучка статьи, голосовой ввод вопроса, подкаст
  - CTA: "Попробовать" → /webchat?model=gpt-audio-mini

- `website/app/3d/page.tsx` — 3D Генерация
  - Hero: "3D модели из текста и фото — для игр, печати, визуализации"
  - Модели: Tripo v3.0, Meshy-6, TripoSR
  - Цены: от $0.21 до $0.90 за модель
  - 3 примера: game asset, 3D печать, product visualization
  - CTA: "Попробовать" → /webchat?category=3d

- Проверить что уже существуют: /chat, /images, /documents, /search, /code, /translate
  - Если нет — создать по аналогии

#### 4.2 Линковка с главной
- Секция инструментов: каждая карточка линкует на свою страницу
  - AI Чат → /chat/about
  - Генерация картинок → /images
  - AI Видео → /video
  - AI Аудио → /audio
  - 3D Генерация → /3d
  - Анализ документов → /documents
  - AI Поиск → /search
  - Reasoning → /code
- Nav dropdown "Инструменты" — все ссылки
- Обновить sitemap.xml

#### 4.3 Стиль страниц
- Manrope, #FAF9F5 bg, #D97757 accent
- Hero: заголовок + подзаголовок + CTA + скриншот/мокап справа
- Секция моделей: карточки с ценами из lib/models.ts
- Примеры: карточки с иконкой + текстом
- CTA внизу: "Попробовать бесплатно" → /webchat?model=ID

### Коммит
```
git add . && git commit -m "feat: add video/audio/3d landing pages, link from homepage" && git push origin main && cd website && railway up --detach
```

---

## 5. Сортировка моделей в чате

### Статус: ⬜ TODO

### Что сделать

#### 5.1 Фильтры в dropdown выбора модели
В webchat dropdown модели добавить табы-фильтры сверху:
```
[Все] [Чат] [Картинки] [Видео] [Аудио] [3D]
```
По клику — фильтрация моделей по category из lib/models.ts.

#### 5.2 Поиск
Input поиска над списком моделей — фильтрация по названию в реальном времени.

#### 5.3 Сортировка
- Бесплатные модели (FREE) — всегда сверху
- Затем по цене (дешёвые → дорогие)
- Внутри категории: по популярности (hardcoded order)

#### 5.4 Визуал
- Badge на каждой модели: FREE (зелёный), PRO (оранжевый)
- Цена рядом с названием
- Цветная полоска слева — цвет компании
- При hover — подсветка

### Коммит
```
git add . && git commit -m "feat: model filters, search, sorting in webchat" && git push origin main && cd website && railway up --detach
```

---

## 6. Deep link на модель

### Статус: ⬜ TODO

### Что сделать

#### 6.1 URL параметры
Webchat должен поддерживать URL параметры:
- `/webchat?model=nano-banana-pro` → автоматически выбрать эту модель
- `/webchat?category=video` → открыть с фильтром "Видео"
- `/webchat?category=3d` → открыть с фильтром "3D"

#### 6.2 Линковка со страниц
- Страницы /video, /audio, /3d, /images — кнопка "Попробовать" → `/webchat?model=MODEL_ID`
- Страница /models — клик на карточку модели → `/webchat?model=MODEL_ID`
- Главная — карточки инструментов → `/webchat?category=CATEGORY`

#### 6.3 Реализация
```tsx
// В webchat page.tsx:
const searchParams = useSearchParams()
const modelParam = searchParams.get('model')
const categoryParam = searchParams.get('category')

useEffect(() => {
  if (modelParam) selectModel(modelParam)
  if (categoryParam) setFilter(categoryParam)
}, [modelParam, categoryParam])
```

### Коммит
```
git add . && git commit -m "feat: deep link to models via URL params" && git push origin main && cd website && railway up --detach
```

---

## 7. Подробные описания моделей + переработка /models

### Статус: ⬜ TODO

### Что сделать

#### 7.1 Описания моделей в lib/models.ts
Добавить для каждой из 50 моделей подробные поля:
```typescript
{
  id: "gpt-5.4",
  name: "GPT-5.4",
  company: "OpenAI",
  // ... существующие поля ...
  description: "Флагманская модель OpenAI. 1М контекст, встроенное использование компьютера. Лучшая для сложных задач, кодинга и длинных документов.",
  strengths: ["1М контекст", "Computer Use", "Мультимодальность", "Кодинг"],
  useCases: "Сложный анализ, кодирование, длинные документы, мультимодальные задачи",
  maxTokens: 128000,
  releaseDate: "2026-03"
}
```

Примеры описаний для ключевых моделей:
- **GPT-5.4**: "Флагманская модель OpenAI. 1М контекст, встроенное использование компьютера. Лучшая для сложных задач, кодинга и длинных документов."
- **Claude Opus 4**: "Самая мощная модель Anthropic. 200К контекст, глубокое рассуждение. Идеальна для аналитики, исследований и творческих задач."
- **Gemini 2.5 Pro**: "Топовая модель Google. 1М контекст, сильна в анализе данных, кодинге и мультимодальных задачах."
- **Grok 3**: "Флагман xAI. 131К контекст, без цензуры, сильное рассуждение. Для тех кто ценит прямые ответы."
- **DeepSeek R1**: "Reasoning-модель от DeepSeek. Показывает цепочку рассуждений. Конкурент o3 по 1/10 цены."
- **Nano Banana Pro**: "Генерация изображений студийного качества от Google. Текст в картинках, редактирование, 4K разрешение."
- **GPT-4o mini**: "Быстрая и дешёвая модель OpenAI. Идеальна для простых задач, переводов и быстрых ответов. Бесплатна."
- **Gemini Flash**: "Самая быстрая модель Google. 1М контекст бесплатно. Идеальна для длинных документов."
- **Kling v2**: "Генерация видео из текста и фото. 5-10 секунд видео в высоком качестве."
- **Tripo v3.0**: "3D модели из текста или фото. PBR текстуры, game-ready качество."

Для ВСЕХ 50 моделей написать реальные описания на основе их возможностей.

#### 7.2 Страница /models — детальные карточки
- По клику на карточку модели — раскрывается детальный вид:
  - Полное описание (2-3 предложения)
  - Сильные стороны (badges/chips)
  - Подходящие задачи
  - Цена input/output за 1М токенов
  - Контекст (128К, 200К, 1М)
  - Провайдер с иконкой
  - Дата релиза
- Внизу детального вида — большая кнопка accent цвета "Попробовать модель" → /webchat?model=MODEL_ID

#### 7.3 Deep link из всех страниц
- /models → клик на модель → "Попробовать" → /webchat?model=ID
- /video → "Попробовать Kling v2" → /webchat?model=kling-v2
- /audio → "Попробовать GPT Audio" → /webchat?model=gpt-audio-mini
- /3d → "Попробовать Tripo" → /webchat?model=tripo-v3
- /images → "Попробовать Nano Banana Pro" → /webchat?model=nano-banana-pro
- /chat/about → "Попробовать GPT-5.4" → /webchat?model=gpt-5.4
- /documents → "Попробовать Claude Opus" → /webchat?model=claude-opus-4
- /search → "Попробовать Perplexity" → /webchat?model=perplexity-sonar-pro

#### 7.4 Webchat — дефолтная модель
- БЕЗ параметра model в URL → welcome screen с выбором модели (НЕ автоматически GPT-4o mini)
- С параметром /webchat?model=XXX → автоматически выбрать эту модель и готов к вводу
- С параметром /webchat?category=video → фильтр на видео-модели

### Коммит
```
git add . && git commit -m "feat: detailed model descriptions, /models redesign, deep links" && git push origin main && cd website && railway up --detach
```

---

## 8. Уникальные тексты + карточки + графика

### Статус: ⬜ TODO

### Агенты
- 🏗 АРХИТЕКТОР: составить список всех мест где нужны изменения
- 💻 КОДЕР: реализовать изменения
- 🧪 ТЕСТЕР: проверить читаемость на 375px и 1440px, уникальность текстов

### Что сделать

#### 8.1 Reasoning → "Глубокий анализ"
Заменить слово "Reasoning" ВЕЗДЕ на сайте на "Глубокий анализ":
- Карточки инструментов
- Фильтры в чате
- Страницы модулей
- Описания моделей

#### 8.2 Уникальные описания 50 моделей
В lib/models.ts каждая модель должна иметь УНИКАЛЬНОЕ description. Запрещено повторять фразы "сильна в кодинге и анализе" у разных моделей. Каждое описание — про конкретную уникальность:
- GPT-5.4: "Новейшая модель OpenAI с контекстом 1М токенов. Объединяет Codex и GPT. Встроенное управление компьютером."
- Claude Opus 4: "Флагман Anthropic — лучший для текстового анализа и творчества. 200К контекст, глубокое понимание."
- Gemini 2.5 Pro: "Топовая модель Google с 1М контекстом. Лучшая в работе с данными и таблицами."
- DeepSeek R1: "Показывает ход мыслей. Конкурент o3 за 1/10 цены. Открытая архитектура."
- Grok 3: "Модель xAI Илона Маска. Без цензуры, прямые ответы, данные из X."
- Nano Banana Pro: "Фотореалистичные изображения 4K. Текст на картинках. Редактирование фото."
- Kling v2: "Видео из текста и фото. 5-10 секунд в высоком качестве."
- Tripo v3.0: "3D модели из текста или фото. PBR текстуры, game-ready."
- GPT Audio: "Озвучка текста 10+ голосами. Естественная речь, стриминг."
И так далее — ВСЕ 50 моделей, каждая уникальна.

#### 8.3 Карточка "AI Аудио" на главной
- Текст нечитаемый — увеличить font-size описания до 14px
- Увеличить контраст текста
- Все карточки инструментов: SVG иллюстрация 48x48 в цветном круге, описание max 2 строки, font-size 14px

#### 8.4 Карточки моделей на главной
- В каждой карточке модели добавить краткое описание (1 строка) помимо названия и цены
- Пример: "GPT-5.4 · OpenAI · $30/1M · Флагман с 1М контекстом"

### Коммит
```
git add . && git commit -m "feat: unique model descriptions, fix card readability, reasoning→глубокий анализ" && git push origin main && cd website && railway up --detach
```

---

## 9. Раскрытие моделей + Hero + Nav чистка

### Статус: ⬜ TODO

### Агенты
- 🏗 АРХИТЕКТОР: определить компоненты для изменений
- 💻 КОДЕР: реализовать
- 🧪 ТЕСТЕР: проверить на всех устройствах, все ссылки работают

### Что сделать

#### 9.1 Страница /models — раскрытие карточек
Сейчас: при клике раскрывается вся строка из 4, текст виден только у одной.
Исправить: каждая карточка раскрывается ИНДИВИДУАЛЬНО под собой. При клике на модель — под ней появляется блок с описанием, сильными сторонами, ценами, кнопкой "Попробовать". Остальные карточки в строке не затрагиваются.

#### 9.2 Hero — убрать поле email
Убрать поле ввода email/телеграм из Hero. Заменить на:
- Две кнопки рядом: "Открыть чат" (primary accent → /webchat) + "Посмотреть модели" (secondary outline → /models)
- Под кнопками мелкий текст: "Бесплатно · Без карты · 10 запросов в день"

#### 9.3 Nav — убрать Рефералы
Убрать "Рефералы" из шапки навигации. Оставить: Инструменты (dropdown), Модели, Цены, Блог, API.
Рефералы доступны только через /profile → таб "Рефералы".

### Коммит
```
git add . && git commit -m "feat: individual model expand, hero CTA update, nav cleanup" && git push origin main && cd website && railway up --detach
```

---

## 10. Цены новых моделей + категории в чате

### Статус: ⬜ TODO

### Агенты
- 🏗 АРХИТЕКТОР: составить таблицу цен, спроектировать UI вкладок
- 💻 КОДЕР: реализовать
- 🧪 ТЕСТЕР: проверить ВСЕ цены (себестоимость × 3-3.5), все вкладки фильтруют корректно

### Что сделать

#### 10.1 Проверка и добавление цен
Проверить что ВСЕ модели имеют цены в lib/models.ts и token_billing.py:
- Видео: Kling ($0.30), Runway ($0.75), Pika ($0.15), Stable Video ($0.12), Luma ($0.45)
- Аудио: GPT Audio ($32/$64 per 1M = per-token), GPT Audio Mini ($0.60/$2.40 per 1M)
- 3D: Tripo ($0.60/модель), Meshy ($0.30/модель), TripoSR ($0.21/модель)
- Все наценки: себестоимость × 3-3.5

Показать таблицу: модель → себестоимость → Stone AI цена → наценка %

#### 10.2 Категории-вкладки в webchat
Добавить вкладки СВЕРХУ чата (под навигацией):
```
[💬 Текст] [🖼 Картинки] [🎬 Видео] [🔊 Аудио] [🧊 3D]
```
- "Текст" — все chat/search/reasoning/code модели
- "Картинки" — Nano Banana Pro, GPT-5 Image, Flux, SDXL
- "Видео" — Kling, Runway, Pika, Stable Video, Luma
- "Аудио" — GPT Audio, GPT Audio Mini
- "3D" — Tripo, Meshy, TripoSR

При переключении:
- Меняется список моделей в dropdown
- UI адаптируется: для картинок — превью результата, для видео — прогресс-бар, для 3D — 3D viewer

#### 10.3 Отдельные окна генерации
Каждая вкладка = своя "рабочая область":
- Текст: стандартный чат с историей
- Картинки: input промта + галерея сгенерированных картинок
- Видео: input промта + загрузка фото + видео-плеер результата
- Аудио: текст для озвучки + выбор голоса + плеер
- 3D: промт или фото + 3D viewer с вращением

### Коммит
```
git add . && git commit -m "feat: model pricing validation, chat category tabs with specialized UIs" && git push origin main && cd website && railway up --detach
```

---

## 11. Демо-контент: видео/фото/3D заставки

### Статус: ⬜ TODO

### Агенты
- 🏗 АРХИТЕКТОР: определить где разместить демо-контент
- 💻 КОДЕР: сгенерировать демо через наши API и встроить
- 🧪 ТЕСТЕР: проверить загрузку, производительность, адаптивность

### Что сделать

#### 11.1 Hero главной страницы
Сгенерировать через Nano Banana Pro:
- Промт: "Futuristic AI platform interface with holographic floating screens showing chat, images, video and 3D models, dark gradient background, cinematic lighting, ultra detailed, 4K"
- Сохранить как website/public/demo/hero-bg.webp
- Использовать как фоновое изображение Hero с overlay gradient
- Также сделать скриншот реального webchat → website/public/demo/chat-mockup.png

#### 11.2 Карточки инструментов на главной (8 штук)
Для каждой карточки сгенерировать мини-иллюстрацию 512x512 через Nano Banana Pro:

1. AI Чат: "Minimalist illustration of chat bubbles with AI glow, gradient blue background, flat design"
2. Генерация картинок: "Collage of 4 small AI generated images: portrait, landscape, product, abstract, arranged in grid"
3. AI Видео: "Film strip with AI-generated video frames, play button in center, gradient red-orange background"
4. Анализ документов: "PDF document with magnifying glass and highlighted text, orange gradient background"
5. AI Поиск: "Globe with search lines and data streams, gradient teal background"
6. Глубокий анализ: "Brain with connected gears and neural pathways, gradient purple background"
7. AI Аудио: "Sound waveform with microphone icon, gradient green background"
8. API: оставить как есть (код-блок)

Сохранить в website/public/demo/tools/ как webp. На карточках показывать как background-image с overlay.

#### 11.3 Галерея демо-картинок для /images
Сгенерировать 6 картинок через Nano Banana Pro (разные стили):
1. "Photorealistic portrait of a young woman with flowing hair, golden hour lighting, bokeh background, 4K"
2. "Epic mountain landscape with aurora borealis reflecting in crystal lake, cinematic, 4K"
3. "Sleek modern smartphone floating on gradient background, product photography, studio lighting"
4. "Abstract geometric art with vibrant neon colors, flowing shapes, digital art"
5. "Futuristic city skyline with flying cars and holographic billboards, cyberpunk style"
6. "Cute corgi puppy in astronaut suit floating in space with Earth behind, digital illustration"

Сохранить в website/public/demo/gallery/. На /images показать как masonry grid.

#### 11.4 Демо-видео для /video и главной
Сгенерировать через fal.ai (Kling/Runway) 2-3 видео:
1. "Camera slowly flying through futuristic neon city at night, cinematic, smooth motion"
2. "Abstract particles forming into glowing AI brain shape, dark background, slow motion"
3. Image-to-video: взять одну из сгенерированных картинок → анимировать

Сохранить в website/public/demo/videos/ как mp4.
На главной: секция с автоплей видео (muted, loop) как демонстрация.
На /video: галерея с плеерами.

#### 11.5 Демо-3D для /3d и главной
Сгенерировать через Tripo/fal.ai 3 модели:
1. "Robot character, friendly design, game-ready"
2. "Modern sneaker shoe, product visualization"
3. "Small house with garden, architectural model"

Сохранить GLB в website/public/demo/3d/.
На /3d: @google/model-viewer для каждой модели с auto-rotate.
На главной: один 3D объект вращается в карточке "3D Генерация".

#### 11.6 Демо-аудио для /audio
Сгенерировать через GPT Audio 3 примера:
1. Мужской голос (alloy): "Stone AI — единая платформа для 50 нейросетей. Генерируйте текст, картинки, видео и 3D."
2. Женский голос (nova): "Добро пожаловать в Stone AI. Попробуйте бесплатно — 10 запросов каждый день."
3. English (echo): "Welcome to Stone AI. 50 AI models in one platform. Start free today."

Сохранить mp3 в website/public/demo/audio/.
На /audio: карточки с кнопкой ▶ и визуализацией waveform.

#### 11.7 OG-картинки для соцсетей
Сгенерировать или создать через SVG/Canvas 4 OG-изображения (1200x630):

1. Главная (og-home.png): Логотип Stone AI + "50 AI-моделей в одном интерфейсе" + фон с gradient mesh + логотипы провайдеров
2. /models (og-models.png): Сетка из 12 логотипов AI-провайдеров + "50+ моделей от OpenAI, Anthropic, Google, xAI"
3. /pricing (og-pricing.png): "Без подписок. Per-token от $0.24/1M" + Free vs Pro визуал
4. /webchat (og-chat.png): Скриншот интерфейса чата + "AI чат с 50 моделями"

Сохранить в website/public/og/.
Прописать в metadata каждой страницы: openGraph.images.

#### 11.8 Размещение на сайте
После генерации всего контента:
- Hero: hero-bg.webp как background + chat-mockup.png справа
- Карточки инструментов: tools/*.webp как фон каждой карточки
- Секция "Наши возможности": автоплей видео + галерея картинок + 3D viewer
- Каждая страница инструмента: свой демо-контент
- OG: metadata во всех layout/page файлах
- Оптимизация: все картинки через next/image, lazy loading, webp формат

### Бюджет генерации
| Контент | Количество | Модель | Примерная стоимость |
|---------|-----------|--------|-------------------|
| Картинки (карточки + галерея + hero) | 15 шт | Nano Banana Pro | ~$2.25 |
| Видео | 3 шт | Kling/fal.ai | ~$0.90 |
| 3D модели | 3 шт | Tripo/fal.ai | ~$0.63 |
| Аудио | 3 шт | GPT Audio | ~$0.10 |
| OG-картинки | 4 шт | SVG/Canvas (бесплатно) | $0 |
| **Итого** | **28 шт** | | **~$3.88** |

### Коммит
```
git add . && git commit -m "feat: demo content - generated images, videos, 3D models, audio samples" && git push origin main && cd website && railway up --detach
```

---

## Порядок выполнения задач 4-11

Claude Code выполняет задачи строго по порядку. Для КАЖДОЙ задачи работают 5 агентов:

### 📊 АГЕНТ-АНАЛИТИК
Перед всеми остальными:
1. Проанализировать целевую аудиторию (русскоязычные разработчики, дизайнеры, фрилансеры 20-35 лет)
2. Определить что зайдёт этой аудитории — какие визуалы, тексты, примеры вызывают доверие и интерес
3. Изучить конкурентов (chatbotai.co, ishushka.com, ChatGPT, Claude.ai) — что у них работает визуально
4. Дать рекомендации дизайнеру: какие цвета привлекают, какие картинки конвертят, какой тон текста
5. Для демо-контента: определить какие сгенерированные примеры произведут WOW-эффект — не generic "закат и горы", а уникальные контрастные примеры которые показывают мощь AI
6. Показать отчёт с рекомендациями ПЕРЕД началом работы

### 🎨 АГЕНТ-ДИЗАЙНЕР (Senior UI/UX)
После аналитика:
1. Определить визуальную иерархию — что пользователь видит первым, вторым, третьим
2. Проверить spacing, alignment, grid consistency — всё должно быть по сетке
3. Подобрать цветовые сочетания для карточек — не random градиенты, а продуманная палитра где каждый цвет имеет смысл (оранжевый = картинки, синий = чат, зелёный = бесплатно, фиолетовый = reasoning)
4. Типографика — иерархия h1→h2→h3→body должна быть чёткой, не прыгать размерами
5. Для демо-контента: составить промты для генерации которые дадут СТИЛЬНЫЙ результат в единой визуальной системе (единая цветовая гамма, единый стиль)
6. Проверить что каждый экран выглядит как продукт за $1M, а не студенческий проект
7. Показать мокап/план визуала ПЕРЕД кодированием

### 🏗 АГЕНТ-АРХИТЕКТОР
После дизайнера:
1. Прочитать описание задачи + рекомендации аналитика + мокап дизайнера
2. Составить план файлов и компонентов для изменения
3. Проверить что план не конфликтует с существующим кодом
4. Определить порядок реализации (что делать первым)
5. Показать план

### 💻 АГЕНТ-КОДЕР
Реализация:
1. Выполнить план архитектора, следуя рекомендациям дизайнера
2. После каждого файла — проверить `npm run build`
3. Если ошибка — исправить сразу
4. Следить за performance: картинки через next/image, lazy loading, webp
5. Коммит + пуш + деплой

### 🧪 АГЕНТ-ТЕСТЕР/КРИТИК
После реализации проверить ЖЁСТКО:
1. Все ссылки работают (нет 404)
2. Фильтры/вкладки реально фильтруют
3. Deep link /webchat?model=XXX работает
4. Адаптивность 375px (iPhone), 393px (iPhone 16), 768px (iPad), 1440px (десктоп)
5. Тексты на русском без ошибок и НЕ повторяются
6. Стиль консистентный — единая палитра, единые отступы, единые border-radius
7. Демо-контент загружается быстро (< 3с), без ошибок
8. Сравнить с chatbotai.co и claude.ai — наш сайт должен выглядеть НЕ ХУЖЕ
9. Найти 3 вещи которые можно улучшить — и улучшить
10. Показать отчёт: ✅ прошло / ❌ не прошло / 💡 улучшено

### Процесс для каждой задачи:
```
АНАЛИТИК → рекомендации
    ↓
ДИЗАЙНЕР → визуальный план  
    ↓
АРХИТЕКТОР → технический план
    ↓
КОДЕР → реализация + деплой
    ↓
ТЕСТЕР → проверка + улучшения → если ❌ → назад к КОДЕРУ
```

Команда запуска: "Прочитай ROADMAP_NEXT.md и выполни задачи #4-#11 по порядку с пятью агентами (аналитик, дизайнер, архитектор, кодер, тестер). Покажи отчёт каждого агента."

---

## 12. Тёмная тема сайта

### Статус: ⬜ TODO

### Что сделать
- CSS variables для всех цветов в globals.css
- Tailwind: dark: классы на всех компонентах
- Toggle в nav (иконка sun/moon) + сохранять в localStorage
- Уважать prefers-color-scheme системы
- Палитра dark: bg #0C0C10, surface #1A1A24, text #E8E4DD, accent #D97757

### Коммит
```
git add . && git commit -m "feat: dark theme with toggle" && git push origin main && cd website && railway up --detach
```

---

## 13. Ребренд (новое название)

### Статус: ⬜ TODO — ждём выбор названия

### Кандидаты
- Nexus AI
- Cortex AI
- Helix AI

### Что менять
- Домен (купить новый)
- Logo в nav, footer, favicon, OG image
- Тексты на сайте, в боте, в TG Mini App
- TG bot username (создать нового бота или rename)
- CLAUDE.md, STRATEGY.md, ROADMAP_NEXT.md
- package.json name
- meta title и description

---

## 14. WhatsApp интеграция

### Статус: ⬜ TODO

### Что сделать
- WhatsApp Business API (Twilio или Meta Cloud API)
- `backend/app/services/whatsapp.py` — обработка вебхуков
- `backend/app/routers/whatsapp.py` — webhook endpoint
- Авторизация по номеру телефона → привязка к аккаунту
- Тот же backend, тот же баланс
- Ограничения: нет inline-кнопок, только текст + картинки

### Env
```
WHATSAPP_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

---

## 15. WeChat интеграция

### Статус: ⬜ TODO — отложено

### Что сделать
- WeChat Official Account API
- Требует китайскую бизнес-регистрацию
- Отложить до появления китайской аудитории

---

## Порядок выполнения

Claude Code выполняет задачи строго по порядку номеров.
Для каждой задачи:
1. Прочитать секцию задачи
2. Реализовать
3. Проверить билд: `cd website && npm run build`
4. Коммит + пуш + деплой: `git push origin main && cd website && railway up --detach`
5. Отметить статус ✅ DONE

Команда для запуска: "Прочитай ROADMAP_NEXT.md и выполни задачу #N"

---

## Итого: после всех задач Stone AI будет

- **Текст**: 50 моделей (чат, поиск, reasoning, код)
- **Картинки**: 6 моделей (Nano Banana, GPT-5 Image, Flux, SDXL)
- **Видео**: 5 моделей (Kling, Runway, Pika, Stable Video, Luma)
- **Аудио**: TTS (GPT Audio, ElevenLabs), STT (Whisper), 10+ голосов
- **3D**: 4 модели (Tripo, Meshy, Rodin, TripoSR)
- **Платформы**: Веб-сайт, Telegram Mini App, Telegram Bot, [WhatsApp], [WeChat]
- **Оплата**: Stars, TON, Карта/СБП, Крипто
- **Тема**: Светлая + тёмная

**Ни один конкурент не предлагает всё это в одном интерфейсе.**


приппри