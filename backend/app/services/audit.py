import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_audit_log import AdminAuditLog

logger = logging.getLogger(__name__)

_SENSITIVE_MARKERS = ("password", "token", "secret", "cookie", "authorization")


def _sanitize_payload(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            lowered = str(key).lower()
            if any(marker in lowered for marker in _SENSITIVE_MARKERS):
                sanitized[str(key)] = "[redacted]"
            else:
                sanitized[str(key)] = _sanitize_payload(item)
        return sanitized
    if isinstance(value, list):
        return [_sanitize_payload(item) for item in value]
    if isinstance(value, tuple):
        return [_sanitize_payload(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


async def log_admin_action(
    db: AsyncSession,
    *,
    admin_user_id: int,
    admin_email: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    payload: dict[str, Any] | None = None,
    result: str = "ok",
    error_message: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Persist an admin action without breaking the parent request on failure."""
    try:
        async with db.begin_nested():
            entry = AdminAuditLog(
                admin_user_id=admin_user_id,
                admin_email=admin_email,
                action=action,
                target_type=target_type,
                target_id=target_id,
                payload=_sanitize_payload(payload) if payload else None,
                result=result,
                error_message=error_message,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(entry)
            await db.flush()
    except Exception as exc:
        logger.warning("audit log write failed: %s", exc)
