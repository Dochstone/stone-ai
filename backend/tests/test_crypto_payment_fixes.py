"""Source-level regression checks for urgent crypto payment fixes."""

from pathlib import Path


ROOT = Path(__file__).parent.parent.parent
BACKEND = ROOT / "backend" / "app"
FRONTEND = ROOT / "frontend"
WEBSITE = ROOT / "website"

PAYMENT_SRC = (BACKEND / "routers" / "payment.py").read_text(encoding="utf-8")
PAYMENT_EXT_SRC = (BACKEND / "routers" / "payment_ext.py").read_text(encoding="utf-8")
TON_SRC = (BACKEND / "services" / "ton.py").read_text(encoding="utf-8")
HELEKET_SRC = (BACKEND / "services" / "heleket.py").read_text(encoding="utf-8")
MAIN_SRC = (BACKEND / "main.py").read_text(encoding="utf-8")
APP_TSX = (FRONTEND / "src" / "App.tsx").read_text(encoding="utf-8")
FRONTEND_MANIFEST = (FRONTEND / "public" / "tonconnect-manifest.json").read_text(encoding="utf-8")
WEBSITE_MANIFEST = (WEBSITE / "public" / "tonconnect-manifest.json").read_text(encoding="utf-8")
FRONTEND_API = (FRONTEND / "api" / "index.py").read_text(encoding="utf-8")


def test_no_preview_vercel_url_remains_in_frontend_or_website():
    assert "stone-ai-1.vercel.app" not in APP_TSX
    assert "stone-ai-1.vercel.app" not in FRONTEND_MANIFEST
    assert "stone-ai-1.vercel.app" not in FRONTEND_API
    assert "stone-ai-1.vercel.app" not in WEBSITE_MANIFEST


def test_ton_manifest_points_to_production():
    assert 'manifestUrl="https://stoneai.ru/tonconnect-manifest.json"' in APP_TSX
    assert '"url": "https://stoneai.ru"' in FRONTEND_MANIFEST
    assert '"url": "https://stoneai.ru"' in WEBSITE_MANIFEST


def test_ton_tolerance_increased_to_five_percent():
    assert "expected_min = expected_amount_ton * 0.95" in TON_SRC
    assert "expected_amount_ton * 0.98" not in TON_SRC


def test_ton_create_order_persists_pending_transaction():
    assert 'provider_id=f"tonconnect:{order[\'order_id\']}"' in PAYMENT_SRC
    assert 'status="pending"' in PAYMENT_SRC
    assert 'currency="TON"' in PAYMENT_SRC


def test_ton_verify_uses_atomic_claim_and_db_fallback():
    assert "from app.routers.payment_ext import _claim_pending_transaction" in PAYMENT_SRC
    assert 'Transaction.provider_id == f"tonconnect:{req.order_id}"' in PAYMENT_SRC
    assert '.with_for_update()' in PAYMENT_SRC
    assert 'raise HTTPException(status_code=410, detail="Сессия заказа истекла. Создайте новый.")' in PAYMENT_SRC
    assert "fallback_tx_hash=tx_info[\"tx_hash\"]" in PAYMENT_SRC
    assert "return {\"status\": \"already_completed\"}" in PAYMENT_SRC


def test_ton_cleanup_loop_is_registered():
    assert "async def ton_cleanup_loop()" in MAIN_SRC
    assert "from app.services.ton import cleanup_expired_orders" in MAIN_SRC
    assert "ton_cleanup_task = asyncio.create_task(ton_cleanup_loop())" in MAIN_SRC
    assert "ton_cleanup_task.cancel()" in MAIN_SRC


def test_heleket_terminal_statuses_are_handled():
    assert 'terminal_failure_statuses = {"fail", "cancel", "system_fail", "wrong_amount"}' in PAYMENT_EXT_SRC
    assert 'terminal_refund_statuses = {"refund_paid"}' in PAYMENT_EXT_SRC
    assert '.values(status="failed")' in PAYMENT_EXT_SRC
    assert '.values(status="refunded")' in PAYMENT_EXT_SRC
    assert 'return {"ok": True, "message": f"Intermediate status: {status}"}' in PAYMENT_EXT_SRC


def test_heleket_signature_uses_deterministic_body_serialization():
    assert "def _serialize_heleket_body(data: dict) -> str:" in HELEKET_SRC
    assert 'json.dumps(data, sort_keys=True, separators=(",", ":"))' in HELEKET_SRC
    assert "def _heleket_sign_body(api_key: str, body_str: str) -> str:" in HELEKET_SRC
    assert "body_str = _serialize_heleket_body(data)" in HELEKET_SRC
    assert "sign = _heleket_sign_body(settings.heleket_api_key, body_str)" in HELEKET_SRC
