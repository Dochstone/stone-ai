"""
Отправка тестового письма июльской акции на конкретный адрес.

Запуск:
    EMAIL_PROXY_KEY=ваш_ключ venv/bin/python scripts/send_test_email.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.email_service import _send_email

# Импортируем шаблон письма из основного скрипта
sys.path.insert(0, str(Path(__file__).resolve().parent))
from send_july_sale import email_html, PROMO_CODE, DISCOUNT_PCT

TEST_EMAIL = "dochstone@gmail.com"
TEST_NAME = None   # None = безличное приветствие
TEST_TIER = "free"

html = email_html(TEST_NAME, TEST_TIER)
subject = f"−{DISCOUNT_PCT}% на Stone AI — акция до 7 июля"

print(f"Отправляю тест на {TEST_EMAIL} ...")
ok = _send_email(TEST_EMAIL, subject, html)
print("✅ Отправлено!" if ok else "❌ Ошибка отправки — проверьте EMAIL_PROXY_KEY и лог выше")
