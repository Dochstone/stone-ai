"""Source-level regression checks for admin audit log integration."""

from pathlib import Path


ROOT = Path(__file__).parent.parent.parent
BACKEND = ROOT / "backend"
APP = BACKEND / "app"
WEBSITE = ROOT / "website"

MIGRATION_SRC = (BACKEND / "migrations" / "2026_04_13_audit_log.sql").read_text(encoding="utf-8")
MODEL_SRC = (APP / "models" / "admin_audit_log.py").read_text(encoding="utf-8")
MODELS_INIT_SRC = (APP / "models" / "__init__.py").read_text(encoding="utf-8")
SERVICE_SRC = (APP / "services" / "audit.py").read_text(encoding="utf-8")
ADMIN_SRC = (APP / "routers" / "admin.py").read_text(encoding="utf-8")
ADMIN_PAGE_SRC = (WEBSITE / "app" / "admin" / "page.tsx").read_text(encoding="utf-8")
AUDIT_PAGE_SRC = (WEBSITE / "app" / "admin" / "audit-log" / "page.tsx").read_text(encoding="utf-8")


def test_audit_migration_creates_table_and_indexes():
    assert "CREATE TABLE admin_audit_log" in MIGRATION_SRC
    assert "payload JSONB" in MIGRATION_SRC
    assert "CREATE INDEX idx_audit_admin" in MIGRATION_SRC
    assert "CREATE INDEX idx_audit_action" in MIGRATION_SRC
    assert "CREATE INDEX idx_audit_target" in MIGRATION_SRC
    assert "CREATE INDEX idx_audit_created" in MIGRATION_SRC


def test_audit_model_and_export_are_present():
    assert 'class AdminAuditLog(Base):' in MODEL_SRC
    assert '__tablename__ = "admin_audit_log"' in MODEL_SRC
    assert "mapped_column(JSONB" in MODEL_SRC
    assert "from app.models.admin_audit_log import AdminAuditLog" in MODELS_INIT_SRC


def test_log_admin_action_sanitizes_payload_and_never_raises():
    assert "def _sanitize_payload(value: Any) -> Any:" in SERVICE_SRC
    assert '_SENSITIVE_MARKERS = ("password", "token", "secret", "cookie", "authorization")' in SERVICE_SRC
    assert "async with db.begin_nested():" in SERVICE_SRC
    assert 'payload=_sanitize_payload(payload) if payload else None' in SERVICE_SRC
    assert 'logger.warning("audit log write failed: %s", exc)' in SERVICE_SRC


def test_admin_write_endpoints_log_to_audit_table():
    assert 'action="subscription_set"' in ADMIN_SRC
    assert 'action="balance_changed"' in ADMIN_SRC
    assert 'action="promo_created"' in ADMIN_SRC
    assert 'action="promo_deleted"' in ADMIN_SRC
    assert 'action="user_banned"' in ADMIN_SRC
    assert 'action="user_unbanned"' in ADMIN_SRC
    assert "await log_admin_action(" in ADMIN_SRC
    assert "await db.commit()" in ADMIN_SRC


def test_admin_audit_log_endpoint_exists_with_filters():
    assert '@router.get("/audit-log")' in ADMIN_SRC
    assert "admin_id: int | None = Query(default=None)" in ADMIN_SRC
    assert 'from_date: datetime | None = Query(default=None, alias="from")' in ADMIN_SRC
    assert 'to_date: datetime | None = Query(default=None, alias="to")' in ADMIN_SRC
    assert ".order_by(AdminAuditLog.created_at.desc())" in ADMIN_SRC
    assert '"items": [' in ADMIN_SRC


def test_admin_ui_links_to_audit_log_page():
    assert 'href="/admin/audit-log"' in ADMIN_PAGE_SRC
    assert "export default function AuditLogPage()" in AUDIT_PAGE_SRC
    assert 'fetch(`${API_URL}/api/admin/audit-log?' in AUDIT_PAGE_SRC
    assert 'JSON.stringify(selected.payload || {}, null, 2)' in AUDIT_PAGE_SRC
