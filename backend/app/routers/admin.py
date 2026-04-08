"""Admin API — stats and user management. Protected by ADMIN_TG_IDS or ADMIN_EMAILS."""

import os
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import select, func, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.web_auth import extract_jwt_from_request, decode_jwt
from app.models import User
from app.models.usage import Usage
from app.models.transaction import Transaction

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _admin_ids() -> set[int]:
    raw = os.getenv("ADMIN_TG_IDS", "")
    if not raw:
        return set()
    return {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}


def _admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    if not raw:
        return set()
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


async def require_admin(tg_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: only allow users listed in ADMIN_TG_IDS."""
    admin_ids = _admin_ids()
    if not admin_ids:
        raise HTTPException(403, "Admin access not configured")
    if tg_user["id"] not in admin_ids:
        raise HTTPException(403, "Admin access denied")
    return tg_user


async def require_web_admin(request: Request) -> dict:
    """Dependency: JWT auth + email whitelist for web admin."""
    token = extract_jwt_from_request(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    payload = decode_jwt(token)
    email = payload.get("email", "").lower()
    admin_emails = _admin_emails()
    if not admin_emails:
        raise HTTPException(403, "Web admin not configured. Set ADMIN_EMAILS env var.")
    if email not in admin_emails:
        raise HTTPException(403, "Admin access denied")
    return payload


@router.get("/stats")
async def admin_stats(
    _admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats: users, DAU, revenue, top models, payment methods."""
    today = date.today()
    month_start = today.replace(day=1)

    # Total users
    total_users = await db.scalar(select(func.count(User.id)))

    # DAU — users with usage today
    dau = await db.scalar(
        select(func.count(func.distinct(Usage.user_tg_id))).where(
            func.date(Usage.created_at) == today
        )
    )

    # Revenue today
    revenue_today = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_usd), 0)).where(
            and_(
                func.date(Transaction.created_at) == today,
                Transaction.status == "completed",
            )
        )
    )

    # Revenue this month
    revenue_month = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_usd), 0)).where(
            and_(
                func.date(Transaction.created_at) >= month_start,
                Transaction.status == "completed",
            )
        )
    )

    # Top 10 models by request count (all time)
    top_models_q = await db.execute(
        select(Usage.model_id, func.count().label("cnt"))
        .group_by(Usage.model_id)
        .order_by(func.count().desc())
        .limit(10)
    )
    top_models = [
        {"model": row.model_id, "requests": row.cnt}
        for row in top_models_q.all()
    ]

    # Payment method breakdown (completed transactions this month)
    payment_q = await db.execute(
        select(
            Transaction.currency,
            func.count().label("cnt"),
            func.coalesce(func.sum(Transaction.amount_usd), 0).label("total_usd"),
        )
        .where(
            and_(
                func.date(Transaction.created_at) >= month_start,
                Transaction.status == "completed",
            )
        )
        .group_by(Transaction.currency)
    )
    payment_breakdown = [
        {"method": row.currency, "count": row.cnt, "total_usd": round(float(row.total_usd), 2)}
        for row in payment_q.all()
    ]

    # Requests today / this month
    requests_today = await db.scalar(
        select(func.count(Usage.id)).where(func.date(Usage.created_at) == today)
    ) or 0

    requests_month = await db.scalar(
        select(func.count(Usage.id)).where(func.date(Usage.created_at) >= month_start)
    ) or 0

    return {
        "total_users": total_users or 0,
        "dau": dau or 0,
        "requests_today": requests_today,
        "requests_month": requests_month,
        "revenue_today_usd": round(float(revenue_today or 0), 2),
        "revenue_month_usd": round(float(revenue_month or 0), 2),
        "top_models": top_models,
        "payment_breakdown": payment_breakdown,
    }


@router.get("/users")
async def admin_users(
    _admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort: str = Query("recent", regex="^(recent|balance|requests)$"),
):
    """List users with key metrics."""
    q = select(User)

    if sort == "balance":
        q = q.order_by(User.balance_usd.desc())
    elif sort == "requests":
        q = q.order_by(User.total_requests.desc())
    else:
        q = q.order_by(User.id.desc())

    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()

    return {
        "users": [
            {
                "tg_id": u.telegram_id,
                "username": u.username,
                "first_name": u.first_name,
                "balance_usd": round(float(u.balance_usd or 0), 4),
                "total_deposited_usd": round(float(u.total_deposited_usd or 0), 2),
                "total_requests": u.total_requests or 0,
                "total_tokens_used": u.total_tokens_used or 0,
                "joined_at": u.joined_at.isoformat() if u.joined_at else None,
            }
            for u in users
        ],
        "count": len(users),
        "offset": offset,
        "limit": limit,
    }


# ── Web Admin endpoints (JWT + email whitelist) ──


@router.get("/web/stats")
async def web_admin_stats(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Same as /stats but for web admin with JWT auth."""
    today = date.today()
    month_start = today.replace(day=1)

    total_users = await db.scalar(select(func.count(User.id))) or 0
    dau = await db.scalar(
        select(func.count(func.distinct(Usage.user_tg_id))).where(func.date(Usage.created_at) == today)
    ) or 0
    revenue_today = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_usd), 0)).where(
            and_(func.date(Transaction.created_at) == today, Transaction.status == "completed")
        )
    ) or 0
    revenue_month = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_usd), 0)).where(
            and_(func.date(Transaction.created_at) >= month_start, Transaction.status == "completed")
        )
    ) or 0
    requests_today = await db.scalar(
        select(func.count(Usage.id)).where(func.date(Usage.created_at) == today)
    ) or 0
    requests_month = await db.scalar(
        select(func.count(Usage.id)).where(func.date(Usage.created_at) >= month_start)
    ) or 0

    top_models_q = await db.execute(
        select(Usage.model_id, func.count().label("cnt"))
        .group_by(Usage.model_id).order_by(func.count().desc()).limit(10)
    )
    top_models = [{"model": r.model_id, "requests": r.cnt} for r in top_models_q.all()]

    payment_q = await db.execute(
        select(Transaction.currency, func.count().label("cnt"),
               func.coalesce(func.sum(Transaction.amount_usd), 0).label("total_usd"))
        .where(and_(func.date(Transaction.created_at) >= month_start, Transaction.status == "completed"))
        .group_by(Transaction.currency)
    )
    payment_breakdown = [
        {"method": r.currency, "count": r.cnt, "total_usd": round(float(r.total_usd), 2)}
        for r in payment_q.all()
    ]

    return {
        "total_users": total_users,
        "dau": dau,
        "requests_today": requests_today,
        "requests_month": requests_month,
        "revenue_today_usd": round(float(revenue_today), 2),
        "revenue_month_usd": round(float(revenue_month), 2),
        "top_models": top_models,
        "payment_breakdown": payment_breakdown,
    }


@router.get("/web/users")
async def web_admin_users(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort: str = Query("recent", regex="^(recent|balance|requests)$"),
    search: str = Query("", description="Search by email, name, or username"),
    tier: str = Query("", description="Filter by subscription tier"),
    date_from: str = Query("", description="Filter joined after (YYYY-MM-DD)"),
    date_to: str = Query("", description="Filter joined before (YYYY-MM-DD)"),
):
    """List users for web admin with search and filters."""
    q = select(User)
    count_q = select(func.count(User.id))

    # Search filter
    if search.strip():
        s = f"%{search.strip().lower()}%"
        search_filter = (
            func.lower(func.coalesce(User.email, "")).like(s)
            | func.lower(func.coalesce(User.first_name, "")).like(s)
            | func.lower(func.coalesce(User.username, "")).like(s)
        )
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    # Tier filter
    if tier.strip():
        if tier == "free":
            tier_filter = (User.subscription_tier == None) | (User.subscription_tier == "free")
        else:
            tier_filter = User.subscription_tier == tier
        q = q.where(tier_filter)
        count_q = count_q.where(tier_filter)

    # Date filters
    if date_from.strip():
        try:
            dt_from = datetime.strptime(date_from.strip(), "%Y-%m-%d")
            q = q.where(User.joined_at >= dt_from)
            count_q = count_q.where(User.joined_at >= dt_from)
        except ValueError:
            pass
    if date_to.strip():
        try:
            dt_to = datetime.strptime(date_to.strip(), "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            q = q.where(User.joined_at <= dt_to)
            count_q = count_q.where(User.joined_at <= dt_to)
        except ValueError:
            pass

    if sort == "balance":
        q = q.order_by(User.balance_usd.desc())
    elif sort == "requests":
        q = q.order_by(User.total_requests.desc())
    else:
        q = q.order_by(User.id.desc())

    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()

    total_count = await db.scalar(count_q) or 0

    # Get last activity for each user from usage table
    user_ids = [u.telegram_id or u.id for u in users]
    last_activity = {}
    if user_ids:
        activity_q = await db.execute(
            select(Usage.user_tg_id, func.max(Usage.created_at).label("last_active"))
            .where(Usage.user_tg_id.in_(user_ids))
            .group_by(Usage.user_tg_id)
        )
        for row in activity_q.all():
            last_activity[row.user_tg_id] = row.last_active

    return {
        "users": [
            {
                "id": u.id,
                "tg_id": u.telegram_id,
                "email": u.email,
                "username": u.username,
                "first_name": u.first_name,
                "balance_usd": round(float(u.balance_usd or 0), 4),
                "total_deposited_usd": round(float(u.total_deposited_usd or 0), 2),
                "subscription_tier": u.subscription_tier or "free",
                "total_requests": u.total_requests or 0,
                "total_tokens_used": u.total_tokens_used or 0,
                "joined_at": u.joined_at.isoformat() if u.joined_at else None,
                "last_active": last_activity.get(u.telegram_id or u.id, u.last_login_date).isoformat()
                    if last_activity.get(u.telegram_id or u.id, u.last_login_date) else None,
            }
            for u in users
        ],
        "total": total_count,
        "offset": offset,
        "limit": limit,
    }


class UpdateSubscriptionRequest(BaseModel):
    tier: str  # free, mini, max, max-pro


@router.patch("/web/users/{user_id}/subscription")
async def web_admin_update_subscription(
    user_id: int,
    body: UpdateSubscriptionRequest,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: change a user's subscription tier."""
    valid_tiers = {"free", "mini", "max", "max-pro"}
    if body.tier not in valid_tiers:
        raise HTTPException(400, f"Invalid tier: {body.tier}. Valid: {', '.join(valid_tiers)}")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    old_tier = user.subscription_tier or "free"
    user.subscription_tier = body.tier if body.tier != "free" else None

    # Reset monthly counters on upgrade
    if body.tier != old_tier:
        user.monthly_fast_used = 0
        user.monthly_premium_used = 0
        user.monthly_images_used = 0
        user.monthly_videos_used = 0

    await db.flush()

    return {
        "status": "ok",
        "user_id": user_id,
        "old_tier": old_tier,
        "new_tier": body.tier,
        "email": user.email,
        "username": user.username,
    }


class UpdateBalanceRequest(BaseModel):
    balance_usd: float  # set exact balance
    reason: str = ""


@router.patch("/web/users/{user_id}/balance")
async def web_admin_update_balance(
    user_id: int,
    body: UpdateBalanceRequest,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: set user balance to exact value."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    old_balance = float(user.balance_usd or 0)
    user.balance_usd = round(body.balance_usd, 6)
    await db.commit()

    return {
        "status": "ok",
        "user_id": user_id,
        "email": user.email,
        "username": user.username,
        "old_balance_usd": round(old_balance, 4),
        "new_balance_usd": round(body.balance_usd, 4),
        "reason": body.reason,
    }


@router.get("/web/transactions")
async def web_admin_transactions(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Recent transactions for web admin."""
    q = (
        select(Transaction)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(q)
    txns = result.scalars().all()

    return {
        "transactions": [
            {
                "id": t.id,
                "user_id": t.user_tg_id,
                "amount_usd": round(float(t.amount_usd or 0), 2),
                "currency": t.currency,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in txns
        ],
    }


@router.get("/web/promos")
async def web_admin_promos(
    _admin: dict = Depends(require_web_admin),
):
    """Promo code usage stats."""
    from app.services.promo import PROMO_CODES, _promo_usage, _promo_total_uses

    promos = []
    for code, config in PROMO_CODES.items():
        promos.append({
            "code": code,
            "type": config["type"],
            "desc": config["desc"],
            "tier": config.get("tier", "—"),
            "days": config.get("days", 0),
            "credits": config.get("credits", 0),
            "used": _promo_total_uses.get(code, 0),
            "max_uses": config["max_uses"],
            "user_ids": list(_promo_usage.get(code, set())),
        })
    return {"promos": promos}


@router.post("/web/promos")
async def web_admin_create_promo(
    request: Request,
    _admin: dict = Depends(require_web_admin),
):
    """Create or update a promo code."""
    from app.services.promo import PROMO_CODES, _promo_usage, _promo_total_uses

    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(400, "Код обязателен")

    PROMO_CODES[code] = {
        "type": body.get("type", "days"),
        "tier": body.get("tier", "mini"),
        "days": int(body.get("days", 7)),
        "credits": int(body.get("credits", 0)),
        "max_uses": int(body.get("max_uses", 1000)),
        "one_per_user": body.get("one_per_user", True),
        "desc": body.get("desc", ""),
    }
    if code not in _promo_usage:
        _promo_usage[code] = set()
    if code not in _promo_total_uses:
        _promo_total_uses[code] = 0

    return {"status": "ok", "code": code}


@router.delete("/web/promos/{code}")
async def web_admin_delete_promo(
    code: str,
    _admin: dict = Depends(require_web_admin),
):
    """Delete a promo code."""
    from app.services.promo import PROMO_CODES, _promo_usage, _promo_total_uses

    code = code.upper()
    if code not in PROMO_CODES:
        raise HTTPException(404, "Промокод не найден")

    del PROMO_CODES[code]
    _promo_usage.pop(code, None)
    _promo_total_uses.pop(code, None)
    return {"status": "ok", "deleted": code}


@router.get("/web/referrals")
async def web_admin_referrals(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Referral stats — users with referrals and earnings."""
    # Users who have referral_code and at least 1 referral
    result = await db.execute(
        select(User).where(User.referral_code.isnot(None)).order_by(User.referral_balance.desc())
    )
    referrers = result.scalars().all()

    data = []
    for u in referrers:
        ref_count = await db.scalar(
            select(func.count()).select_from(User).where(User.referrer_id == u.telegram_id)
        ) or 0
        if ref_count > 0 or float(u.referral_balance or 0) > 0:
            data.append({
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "first_name": u.first_name,
                "referral_code": u.referral_code,
                "referral_count": ref_count,
                "referral_balance": round(float(u.referral_balance or 0), 2),
                "subscription_tier": u.subscription_tier or "free",
            })

    # Also count total referral registrations
    total_referred = await db.scalar(
        select(func.count()).select_from(User).where(User.referrer_id.isnot(None))
    ) or 0

    return {
        "referrers": data,
        "total_referred_users": total_referred,
    }


class NewsletterRequest(BaseModel):
    subject: str
    content_html: str
    test_email: str | None = None  # if set, send only to this email


@router.post("/newsletter")
async def send_newsletter_admin(
    body: NewsletterRequest,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send newsletter to all users with email (or test to single email)."""
    from app.services.email_service import send_newsletter
    import asyncio

    if body.test_email:
        send_newsletter(body.test_email, body.subject, body.content_html)
        return {"status": "ok", "sent": 1, "test": True}

    # Get all users with email
    result = await db.execute(
        select(User.email).where(
            User.email.isnot(None),
            User.email != "",
        )
    )
    emails = [r for r in result.scalars().all() if r and "@" in r]

    # Send in background with small delays to avoid spam throttling
    import threading

    def send_batch():
        for i, email in enumerate(emails):
            try:
                send_newsletter(email, body.subject, body.content_html)
            except Exception:
                pass
            if i % 10 == 9:
                import time
                time.sleep(1)  # 1s pause every 10 emails

    threading.Thread(target=send_batch, daemon=True).start()

    return {"status": "ok", "queued": len(emails)}


# ─── Violations & Banning ───

@router.get("/web/violations")
async def web_admin_violations(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List content violations for admin review."""
    from app.models.violation import Violation

    total = await db.scalar(select(func.count()).select_from(Violation)) or 0

    result = await db.execute(
        select(Violation)
        .order_by(Violation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    return {
        "violations": [
            {
                "id": v.id,
                "user_tg_id": v.user_tg_id,
                "username": v.username,
                "email": v.email,
                "module": v.module,
                "prompt": v.prompt[:500],
                "blocked_reason": v.blocked_reason,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in items
        ],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


class BanRequest(BaseModel):
    reason: str = "Нарушение правил использования"


@router.post("/web/users/{user_id}/ban")
async def web_admin_ban_user(
    user_id: int,
    body: BanRequest,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Ban a user by database ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_banned = True
    user.ban_reason = body.reason[:256]
    await db.commit()

    return {
        "status": "banned",
        "user_id": user_id,
        "username": user.username,
        "email": user.email,
        "reason": body.reason,
    }


@router.post("/web/users/{user_id}/unban")
async def web_admin_unban_user(
    user_id: int,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Unban a user by database ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_banned = False
    user.ban_reason = None
    await db.commit()

    return {
        "status": "unbanned",
        "user_id": user_id,
        "username": user.username,
        "email": user.email,
    }


@router.get("/web/violations/count")
async def web_admin_violations_count(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Quick count of new violations (for badge in admin panel)."""
    from app.models.violation import Violation
    total = await db.scalar(select(func.count()).select_from(Violation)) or 0
    return {"count": total}
