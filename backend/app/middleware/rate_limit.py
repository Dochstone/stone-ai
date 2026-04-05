"""Simple in-memory rate limiter for FastAPI."""

import time
from collections import defaultdict
from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str):
        now = time.time()
        hits = self._hits[key]
        # Remove expired entries
        self._hits[key] = [t for t in hits if now - t < self.window]
        if len(self._hits[key]) >= self.max_requests:
            raise HTTPException(429, f"Слишком много запросов. Попробуйте через {self.window}с")
        self._hits[key].append(now)


# Pre-configured limiters
bot_create_limiter = RateLimiter(max_requests=5, window_seconds=60)  # 5 per minute
agent_run_limiter = RateLimiter(max_requests=3, window_seconds=60)   # 3 per minute
