"""Source-level regression checks for the April 2026 security audit fixes."""

from pathlib import Path


ROOT = Path(__file__).parent.parent.parent
BACKEND = ROOT / "backend"

PAYMENT_SRC = (BACKEND / "app" / "routers" / "payment.py").read_text(encoding="utf-8")
PAYMENT_EXT_SRC = (BACKEND / "app" / "routers" / "payment_ext.py").read_text(encoding="utf-8")
AUTH_SRC = (BACKEND / "app" / "routers" / "auth.py").read_text(encoding="utf-8")
USER_SRC = (BACKEND / "app" / "routers" / "user.py").read_text(encoding="utf-8")
CHAT_SRC = (BACKEND / "app" / "routers" / "chat.py").read_text(encoding="utf-8")
LIMITER_SRC = (BACKEND / "app" / "services" / "limiter.py").read_text(encoding="utf-8")
DAILY_LIMITS_SRC = (BACKEND / "app" / "services" / "daily_limits.py").read_text(encoding="utf-8")
EMAIL_SERVICE_SRC = (BACKEND / "app" / "services" / "email_service.py").read_text(encoding="utf-8")
TON_SERVICE_SRC = (BACKEND / "app" / "services" / "ton.py").read_text(encoding="utf-8")
PLATEGA_SERVICE_SRC = (BACKEND / "app" / "services" / "platega.py").read_text(encoding="utf-8")
EMAIL_PROXY_SRC = (ROOT / "email-proxy.py").read_text(encoding="utf-8")
DEMO1_SRC = (ROOT / "marketing" / "record_demo.py").read_text(encoding="utf-8")
DEMO2_SRC = (ROOT / "marketing" / "record_demo2.py").read_text(encoding="utf-8")


class TestMoneyHardening:
    def test_stars_confirm_requires_internal_key(self):
        assert "_require_internal_payment_request" in PAYMENT_SRC
        assert "X-Stone-Internal-Key" in PAYMENT_SRC
        assert '"status": "already_processed"' in PAYMENT_SRC

    def test_webhooks_fail_closed_when_verification_missing(self):
        assert 'if not settings.heleket_api_key' in PAYMENT_EXT_SRC
        assert 'raise HTTPException(status_code=403, detail="Invalid signature")' in PAYMENT_EXT_SRC

    def test_webhooks_claim_pending_transactions_with_row_lock(self):
        assert "async def _claim_pending_transaction" in PAYMENT_EXT_SRC
        assert '.where(Transaction.provider_id == provider_id, Transaction.status == "pending")' in PAYMENT_EXT_SRC
        assert ".with_for_update()" in PAYMENT_EXT_SRC

    def test_platega_subscription_amount_is_server_derived(self):
        assert 'is_subscription = req.tier and req.tier in ("mini", "max", "max-pro")' in PAYMENT_EXT_SRC
        assert "from app.services.subscription import PLANS" in PAYMENT_EXT_SRC
        assert 'if req.tier not in PLANS' in PAYMENT_EXT_SRC
        assert 'amount_usd=usd_amount' in PAYMENT_EXT_SRC

    def test_ton_subscription_does_not_trust_client_amount(self):
        assert "amount_ton: float | None = None" in PAYMENT_EXT_SRC
        assert 'amount_ton = round(price_usd / ton_usd, 4)' in PAYMENT_EXT_SRC
        assert "TON_MERCHANT_WALLET" not in PAYMENT_EXT_SRC
        assert '"confirmed_tx_hash"' in PAYMENT_EXT_SRC

    def test_platega_header_check_uses_constant_time_compare(self):
        assert "hmac.compare_digest" in PLATEGA_SERVICE_SRC


class TestAuthAndLimitsHardening:
    def test_subscribe_endpoint_uses_lock_and_commit(self):
        assert 'select(User).where(User.id == user_id).with_for_update()' in USER_SRC
        assert 'select(User).where(User.telegram_id == tg_user["id"]).with_for_update()' in USER_SRC
        assert "await db.commit()" in USER_SRC

    def test_telegram_link_requires_password_and_account_age(self):
        assert "password: str" in AUTH_SRC
        assert "verify_password(body.password, web_user.password_hash)" in AUTH_SRC
        assert "Wait 1 hour before linking Telegram" in AUTH_SRC

    def test_verification_requests_are_rate_limited(self):
        assert "RateLimiter(max_requests=3, window_seconds=300)" in AUTH_SRC
        assert '_throttle_verification_request(request, email, "register")' in AUTH_SRC
        assert '_throttle_verification_request(request, email, "reset")' in AUTH_SRC

    def test_guest_ip_spoofing_fix_uses_trusted_proxy_list(self):
        assert "def _get_request_ip" in CHAT_SRC
        assert "settings.trusted_proxy_ips" in CHAT_SRC
        assert 'request.headers.get("X-Real-IP")' in CHAT_SRC

    def test_subscription_expiry_and_daily_usage_are_hardened(self):
        assert "check_and_expire_subscription" in LIMITER_SRC
        assert "await check_and_expire_subscription(db, user)" in LIMITER_SRC
        assert "lock_for_update=True" in DAILY_LIMITS_SRC


class TestSecretsHardening:
    def test_email_proxy_uses_environment_variables(self):
        assert 'os.getenv("SMTP_PASSWORD", "")' in EMAIL_PROXY_SRC
        assert 'os.getenv("EMAIL_PROXY_KEY", "")' in EMAIL_PROXY_SRC
        assert "stoneai-email-secret-2026" not in EMAIL_PROXY_SRC
        assert "u58qbUsva9A@@" not in EMAIL_PROXY_SRC

    def test_email_service_has_no_hardcoded_key_fallback(self):
        assert 'EMAIL_PROXY_KEY = os.getenv("EMAIL_PROXY_KEY", "")' in EMAIL_SERVICE_SRC

    def test_marketing_scripts_use_env_credentials(self):
        assert "STONE_DEMO_EMAIL" in DEMO1_SRC
        assert "STONE_DEMO_PASSWORD" in DEMO1_SRC
        assert "STONE_DEMO_EMAIL" in DEMO2_SRC
        assert "STONE_DEMO_PASSWORD" in DEMO2_SRC
        assert "Asde123asd@" not in DEMO1_SRC
        assert "Asde123asd@" not in DEMO2_SRC

    def test_ton_comment_entropy_is_32_hex_chars(self):
        assert "hexdigest()[:32]" in TON_SERVICE_SRC
