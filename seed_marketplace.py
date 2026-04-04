import psycopg2, uuid, os, json, subprocess

DB_URL = ''


conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

templates = [
    {"category": "marketing", "title": "Анализ целевой аудитории", "description": "Детальный портрет ЦА для продукта", "content": "Проведи анализ ЦА для продукта: {product}. Ниша: {niche}.\n\nОпиши: демография, психография, боли, триггеры покупки, возражения.", "variables": [{"name": "product", "label": "Продукт", "placeholder": "Онлайн-курс"}, {"name": "niche", "label": "Ниша", "placeholder": "EdTech"}]},
    {"category": "marketing", "title": "5 рекламных офферов", "description": "Цепляющие офферы для рекламы", "content": "Создай 5 офферов для: {product}.\nАудитория: {audience}.\nБоль: {pain}.\nКаждый до 150 символов с CTA.", "variables": [{"name": "product", "label": "Продукт", "placeholder": "CRM"}, {"name": "audience", "label": "Аудитория", "placeholder": "Владельцы бизнеса"}, {"name": "pain", "label": "Боль", "placeholder": "Теряют заявки"}]},
    {"category": "marketing", "title": "SWOT-анализ", "description": "Сильные/слабые стороны, возможности и угрозы", "content": "SWOT-анализ для {company}. Отрасль: {industry}. Конкуренты: {competitors}.\nПо 5-7 пунктов + 3 рекомендации.", "variables": [{"name": "company", "label": "Компания", "placeholder": "Интернет-магазин"}, {"name": "industry", "label": "Отрасль", "placeholder": "E-commerce"}, {"name": "competitors", "label": "Конкуренты", "placeholder": "WB, Ozon"}]},
    {"category": "smm", "title": "Контент-план на месяц", "description": "30 идей постов с типами и форматами", "content": "Контент-план на 30 дней для {platform}. Ниша: {niche}. {frequency} постов/нед.\nДля каждого: тема, тип, формат.", "variables": [{"name": "platform", "label": "Платформа", "placeholder": "Telegram"}, {"name": "niche", "label": "Ниша", "placeholder": "Фитнес"}, {"name": "frequency", "label": "Постов/нед", "placeholder": "5"}]},
    {"category": "smm", "title": "Пост для Telegram", "description": "Вовлекающий пост с CTA и хештегами", "content": "Пост для Telegram. Тема: {topic}. Тон: {tone}.\n300-600 символов, хук, польза, CTA, эмодзи, хештеги.", "variables": [{"name": "topic", "label": "Тема", "placeholder": "AI тренды 2026"}, {"name": "tone", "label": "Тон", "placeholder": "экспертный"}]},
    {"category": "seo", "title": "LSI семантическое ядро", "description": "Ключевые слова + LSI + FAQ для статьи", "content": "Семантическое ядро для: {topic}.\nОсновной ключ, ВЧ(5), СЧ(10), НЧ(15), LSI(20), FAQ(10).", "variables": [{"name": "topic", "label": "Тема", "placeholder": "Как выбрать CRM"}]},
    {"category": "copywriting", "title": "Текст для лендинга", "description": "Продающий текст по формуле AIDA", "content": "Продающий текст. Продукт: {product}. ЦА: {audience}. Преимущество: {benefit}.\nЗаголовок 4U, проблема, решение, 5 выгод, CTA.", "variables": [{"name": "product", "label": "Продукт", "placeholder": "SaaS"}, {"name": "audience", "label": "ЦА", "placeholder": "Маркетологи"}, {"name": "benefit", "label": "Преимущество", "placeholder": "Экономит 10ч/нед"}]},
    {"category": "copywriting", "title": "Welcome email-серия", "description": "3 письма для новых подписчиков", "content": "Welcome-серия 3 письма для {business}. ЦА: {audience}.\n1: приветствие+бонус. 2: ценность+кейс. 3: оффер+дедлайн.", "variables": [{"name": "business", "label": "Бизнес", "placeholder": "Онлайн-школа"}, {"name": "audience", "label": "ЦА", "placeholder": "Новые ученики"}]},
    {"category": "code", "title": "Код-ревью", "description": "Анализ кода с рекомендациями", "content": "Код-ревью. Язык: {language}.\n```\n{code}\n```\nБаги, производительность, безопасность, читаемость + fix.", "variables": [{"name": "language", "label": "Язык", "placeholder": "Python"}, {"name": "code", "label": "Код", "placeholder": "Вставьте код"}]},
    {"category": "business", "title": "Питч инвестору (1 мин)", "description": "Краткая презентация проекта", "content": "Питч 1 мин. Проект: {project}. Рынок: {market}. Стадия: {stage}.\nПроблема, решение, рынок, модель, трекшн, команда, запрос.", "variables": [{"name": "project", "label": "Проект", "placeholder": "AI-платформа"}, {"name": "market", "label": "Рынок", "placeholder": "MarTech"}, {"name": "stage", "label": "Стадия", "placeholder": "MVP"}]},
    {"category": "business", "title": "Скрипт холодного звонка", "description": "Скрипт для первого контакта", "content": "Скрипт звонка. Продукт: {product}. ЛПР: {audience}. Цель: {goal}.\nПриветствие, квалификация, боль, презентация, возражения, закрытие.", "variables": [{"name": "product", "label": "Продукт", "placeholder": "CRM"}, {"name": "audience", "label": "ЛПР", "placeholder": "Директор"}, {"name": "goal", "label": "Цель", "placeholder": "Демо"}]},
    {"category": "code", "title": "REST API документация", "description": "Swagger-style документация", "content": "Документация REST API. Сервис: {service}. Эндпоинты: {endpoints}.\nМетод, URL, параметры, тело, ответ, ошибки. Markdown.", "variables": [{"name": "service", "label": "Сервис", "placeholder": "Заказы"}, {"name": "endpoints", "label": "Эндпоинты", "placeholder": "GET /orders, POST /orders"}]},
]

count = 0
for t in templates:
    tid = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO prompt_templates (id, category, title, description, content, variables, usage_count, is_system, is_public, likes, author_name) VALUES (%s,%s,%s,%s,%s,%s,0,false,true,0,%s)",
        (tid, t["category"], t["title"], t["description"], t["content"], json.dumps(t["variables"], ensure_ascii=False), "Stone AI")
    )
    count += 1

conn.commit()
print(f"Seeded {count} marketplace templates!")
cur.execute("SELECT COUNT(*) FROM prompt_templates WHERE is_public=true")
print(f"Total public: {cur.fetchone()[0]}")
conn.close()
