"""Source-level regression checks for Photo Session hardening."""

from pathlib import Path


PHOTO_SESSION_SRC = (
    Path(__file__).parent.parent / "app" / "routers" / "photo_session.py"
).read_text(encoding="utf-8")


def test_dead_code_is_absent():
    assert "use_openai" not in PHOTO_SESSION_SRC
    assert "def _validate_image_size" not in PHOTO_SESSION_SRC


def test_dual_rate_limiters_are_defined():
    assert "photo_session_minute_limiter = RateLimiter(max_requests=5, window_seconds=60)" in PHOTO_SESSION_SRC
    assert "photo_session_hour_limiter = RateLimiter(max_requests=20, window_seconds=3600)" in PHOTO_SESSION_SRC


def test_photo_session_uses_both_rate_limits():
    assert "def _check_photo_session_rate_limit(user_key: str):" in PHOTO_SESSION_SRC
    assert "photo_session_minute_limiter.check(user_key)" in PHOTO_SESSION_SRC
    assert "photo_session_hour_limiter.check(user_key)" in PHOTO_SESSION_SRC
    assert PHOTO_SESSION_SRC.count("_check_photo_session_rate_limit(str(tg_id))") == 4


def test_strict_base64_validation_exists():
    assert "def _validate_base64_image(b64: str) -> bytes:" in PHOTO_SESSION_SRC
    assert "base64.b64decode(padded, validate=True)" in PHOTO_SESSION_SRC
    assert "Image.open(io.BytesIO(data)) as image" in PHOTO_SESSION_SRC
    assert 'raise HTTPException(400, "Некорректный base64")' in PHOTO_SESSION_SRC
    assert 'raise HTTPException(400, "Файл не является изображением")' in PHOTO_SESSION_SRC
    assert 'raise HTTPException(413, "Изображение слишком большое (макс 10 МБ)")' in PHOTO_SESSION_SRC


def test_all_photo_session_endpoints_use_strict_image_validation():
    assert "_validate_base64_image(req.image_base64)" in PHOTO_SESSION_SRC
    assert "_validate_base64_image(req.product_image_base64)" in PHOTO_SESSION_SRC
    assert "_validate_base64_image(img)" in PHOTO_SESSION_SRC


def test_batch_pricing_uses_shared_per_image_cost():
    assert "def get_per_image_cost(tier: str | None, model_id: str | None = None) -> float:" in PHOTO_SESSION_SRC
    assert '"""Per-image cost with tier discount applied."""' in PHOTO_SESSION_SRC
    assert 'return apply_discount(base_cost, tier or "free")' in PHOTO_SESSION_SRC
    assert "per_image_cost = get_per_image_cost(tier, model_id_used)" in PHOTO_SESSION_SRC
    assert "total_cost = per_image_cost * len(req.images)" in PHOTO_SESSION_SRC
    assert "user.balance_usd = max(0, float(user.balance_usd or 0) - per_image_cost)" in PHOTO_SESSION_SRC
