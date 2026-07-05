"""
Smoke-test всех активных чат-моделей Stone AI через OpenRouter.

Отправляет минимальный запрос к каждой модели параллельно и выводит результат.
Образные модели (tier 4) пропускаются — у них другой API.

Запуск:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/test_models.py
    venv/bin/python scripts/test_models.py --fast     # только tier 1 + tier 5 (бесплатные)
    venv/bin/python scripts/test_models.py --id gpt-4o-mini claude-opus-4  # конкретные модели
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from app.config import get_settings
from app.services.ai_router import MODELS_REGISTRY

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT = 30.0
CONCURRENCY = 10  # параллельных запросов одновременно
TEST_MESSAGE = [{"role": "user", "content": "Reply with exactly one word: OK"}]

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
GRAY   = "\033[90m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


async def test_model(client: httpx.AsyncClient, model: dict, api_key: str, webapp_url: str) -> dict:
    start = time.monotonic()
    try:
        messages = TEST_MESSAGE
        # Reasoning models don't support system role — safe for user-only messages
        resp = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": webapp_url,
                "X-Title": "Stone AI",
                "Content-Type": "application/json",
            },
            json={
                "model": model["openrouter_id"],
                "messages": messages,
                "max_tokens": 16,
                "stream": False,
            },
            timeout=TIMEOUT,
        )
        elapsed = time.monotonic() - start

        if resp.status_code != 200:
            body = resp.text[:120].replace("\n", " ")
            return {"id": model["id"], "ok": False, "elapsed": elapsed, "error": f"HTTP {resp.status_code}: {body}"}

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            return {"id": model["id"], "ok": False, "elapsed": elapsed, "error": "empty choices"}

        message = choices[0].get("message", {})
        content = (message.get("content") or "").strip()
        # Reasoning models (o3, o4-mini, deepseek-r1, etc.) may return content=null
        # and put their actual output in reasoning_content
        if not content:
            content = (message.get("reasoning_content") or "").strip()
        if not content:
            return {"id": model["id"], "ok": False, "elapsed": elapsed, "error": "empty content"}

        return {"id": model["id"], "ok": True, "elapsed": elapsed, "reply": content[:60]}

    except httpx.TimeoutException:
        return {"id": model["id"], "ok": False, "elapsed": TIMEOUT, "error": "timeout"}
    except Exception as e:
        return {"id": model["id"], "ok": False, "elapsed": time.monotonic() - start, "error": str(e)[:80]}


async def main():
    settings = get_settings()
    api_key = settings.openrouter_api_key
    webapp_url = getattr(settings, "webapp_url", "https://stoneai.ru")

    fast_only = "--fast" in sys.argv
    specific = [a for a in sys.argv[1:] if not a.startswith("--")]

    # Выбираем модели для теста
    models = [
        m for m in MODELS_REGISTRY
        if m.get("active", True)
        and m.get("category") != "image"
    ]

    if specific:
        models = [m for m in models if m["id"] in specific]
    elif fast_only:
        models = [m for m in models if m["tier"] in (1, 5)]

    print(f"\n{BOLD}Stone AI — проверка моделей ({len(models)} шт.){RESET}")
    print(f"Параллельность: {CONCURRENCY}  |  Timeout: {TIMEOUT}s\n")
    print(f"{'Модель':<28} {'Провайдер':<13} {'Тир':<4} {'Статус':<8} {'Время':<8} {'Ответ / Ошибка'}")
    print("─" * 100)

    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = []

    async def run(model):
        async with semaphore:
            result = await test_model(client, model, api_key, webapp_url)
            # Печатаем сразу по мере поступления
            m = next(x for x in models if x["id"] == model["id"])
            if result["ok"]:
                status = f"{GREEN}✓ OK{RESET}"
                detail = f"{GRAY}{result['reply']}{RESET}"
            else:
                status = f"{RED}✗ FAIL{RESET}"
                detail = f"{YELLOW}{result['error']}{RESET}"
            tier_label = f"T{m['tier']}"
            print(f"{result['id']:<28} {m['company']:<13} {tier_label:<4} {status:<18} {result['elapsed']:>5.1f}s   {detail}")
            results.append(result)

    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[run(m) for m in models])

    ok  = [r for r in results if r["ok"]]
    bad = [r for r in results if not r["ok"]]

    print("\n" + "─" * 100)
    print(f"{BOLD}Итого:{RESET}  {GREEN}{len(ok)} работают{RESET}  |  {RED}{len(bad)} не отвечают{RESET}")

    if bad:
        print(f"\n{RED}{BOLD}Не работают:{RESET}")
        for r in bad:
            print(f"  ✗ {r['id']:<28} {r['error']}")

    avg = sum(r["elapsed"] for r in ok) / len(ok) if ok else 0
    print(f"\nСреднее время ответа: {avg:.1f}s\n")


if __name__ == "__main__":
    asyncio.run(main())
