"""Admin API — stats and user management. Protected by ADMIN_TG_IDS or ADMIN_EMAILS."""

import logging
import os
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import select, func, case, and_, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.web_auth import extract_jwt_from_request, decode_jwt
from app.models import User
from app.models.usage import Usage
from app.models.transaction import Transaction
from app.models.video_task import VideoTask
from app.models.image_task import ImageTask
from app.services.audit import log_admin_action

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


def _period_bounds(period: str | None) -> tuple[datetime | None, datetime | None, str]:
    if not period:
        period = date.today().strftime("%Y-%m")

    if period == "today":
        today = date.today()
        start = datetime(today.year, today.month, today.day)
        return start, start + timedelta(days=1), today.isoformat()

    if len(period) == 10:
        try:
            day = date.fromisoformat(period)
        except ValueError as exc:
            raise HTTPException(400, "Invalid period format. Use today, YYYY-MM, or YYYY-MM-DD.") from exc
        start = datetime(day.year, day.month, day.day)
        return start, start + timedelta(days=1), period

    if len(period) == 7:
        try:
            year, month = int(period[:4]), int(period[5:7])
            start = datetime(year, month, 1)
        except ValueError as exc:
            raise HTTPException(400, "Invalid period format. Use today, YYYY-MM, or YYYY-MM-DD.") from exc
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)
        return start, end, period

    raise HTTPException(400, "Invalid period format. Use today, YYYY-MM, or YYYY-MM-DD.")


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


def _audit_actor(admin: dict) -> tuple[int, str | None]:
    return int(admin.get("sub") or 0), admin.get("email")


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    value = request.headers.get("user-agent", "").strip()
    return value[:500] if value else None


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

    from app.models.daily_usage import DailyUsage
    total_users = await db.scalar(select(func.count(User.id))) or 0
    dau = await db.scalar(
        select(func.count(func.distinct(DailyUsage.user_tg_id))).where(DailyUsage.date == today)
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
        select(func.coalesce(
            func.sum(DailyUsage.fast_used + DailyUsage.premium_used + DailyUsage.image_used + DailyUsage.video_used), 0
        )).where(DailyUsage.date == today)
    ) or 0
    requests_month = await db.scalar(
        select(func.coalesce(
            func.sum(DailyUsage.fast_used + DailyUsage.premium_used + DailyUsage.image_used + DailyUsage.video_used), 0
        )).where(DailyUsage.date >= month_start)
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

    # Get request counts and last activity from daily_usage
    from app.models.daily_usage import DailyUsage
    today = date.today()
    user_ids = [u.telegram_id or u.id for u in users]
    user_requests = {}
    user_today = {}
    last_activity = {}
    if user_ids:
        req_q = await db.execute(
            select(
                DailyUsage.user_tg_id,
                func.coalesce(func.sum(DailyUsage.fast_used + DailyUsage.premium_used + DailyUsage.image_used + DailyUsage.video_used), 0).label("total"),
                func.max(DailyUsage.date).label("last_date"),
            )
            .where(DailyUsage.user_tg_id.in_(user_ids))
            .group_by(DailyUsage.user_tg_id)
        )
        for row in req_q.all():
            user_requests[row.user_tg_id] = row.total
            last_activity[row.user_tg_id] = row.last_date
        # Today's requests per user
        today_q = await db.execute(
            select(
                DailyUsage.user_tg_id,
                func.coalesce(DailyUsage.fast_used + DailyUsage.premium_used + DailyUsage.image_used + DailyUsage.video_used, 0).label("today"),
            )
            .where(DailyUsage.user_tg_id.in_(user_ids), DailyUsage.date == today)
        )
        for row in today_q.all():
            user_today[row.user_tg_id] = row.today

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
                "total_requests": user_requests.get(u.telegram_id or u.id, 0),
                "today_requests": user_today.get(u.telegram_id or u.id, 0),
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
    request: Request,
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
        admin_user_id, admin_email = _audit_actor(_admin)
        await log_admin_action(
            db,
            admin_user_id=admin_user_id,
            admin_email=admin_email,
            action="subscription_set",
            target_type="user",
            target_id=str(user_id),
            payload={"tier": body.tier},
            result="error",
            error_message="user not found",
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        await db.commit()
        raise HTTPException(404, "User not found")

    from datetime import datetime, timedelta

    old_tier = user.subscription_tier or "free"
    user.subscription_tier = body.tier if body.tier != "free" else None

    # Set subscription dates when upgrading from admin
    if body.tier != "free" and body.tier != old_tier:
        now = datetime.utcnow()
        user.subscription_started = now
        user.credits_reset_date = now + timedelta(days=30)
        user.monthly_fast_used = 0
        user.monthly_premium_used = 0
        user.monthly_images_used = 0
        user.monthly_videos_used = 0
    elif body.tier == "free":
        user.credits_reset_date = None
        user.subscription_started = None

    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="subscription_set",
        target_type="user",
        target_id=str(user.id),
        payload={"old_tier": old_tier, "new_tier": body.tier},
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await db.flush()
    await db.commit()

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
    request: Request,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: set user balance to exact value."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        admin_user_id, admin_email = _audit_actor(_admin)
        await log_admin_action(
            db,
            admin_user_id=admin_user_id,
            admin_email=admin_email,
            action="balance_changed",
            target_type="user",
            target_id=str(user_id),
            payload={"new_balance_usd": round(body.balance_usd, 6), "reason": body.reason},
            result="error",
            error_message="user not found",
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        await db.commit()
        raise HTTPException(404, "User not found")

    old_balance = float(user.balance_usd or 0)
    user.balance_usd = round(body.balance_usd, 6)
    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="balance_changed",
        target_type="user",
        target_id=str(user.id),
        payload={
            "old_balance_usd": round(old_balance, 6),
            "new_balance_usd": round(body.balance_usd, 6),
            "reason": body.reason,
        },
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
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
    total = await db.scalar(select(func.count()).select_from(Transaction)) or 0

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
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/web/promos")
async def web_admin_promos(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promo code usage stats."""
    from app.services.promo import PROMO_CODES, _count_promo_uses

    promos = []
    for code, config in PROMO_CODES.items():
        used = await _count_promo_uses(db, code)
        promos.append({
            "code": code,
            "type": config["type"],
            "desc": config.get("desc", ""),
            "tier": config.get("tier", "—"),
            "days": config.get("days", 0),
            "credits": config.get("credits", 0),
            "discount_value": config.get("discount_value", 0),
            "used": used,
            "max_uses": config["max_uses"],
        })
    return {"promos": promos}


@router.post("/web/promos")
async def web_admin_create_promo(
    request: Request,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a promo code."""
    from app.services.promo import PROMO_CODES

    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(400, "Код обязателен")

    promo_type = body.get("type", "days")
    promo_data: dict = {
        "type": promo_type,
        "tier": body.get("tier", "mini"),
        "days": int(body.get("days") or 7),
        "credits": int(body.get("credits") or 0),
        "discount_value": int(body.get("discount_value") or 0),
        "max_uses": int(body.get("max_uses") or 1000),
        "one_per_user": body.get("one_per_user", True),
        "desc": body.get("desc", ""),
    }
    PROMO_CODES[code] = promo_data
    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="promo_created",
        target_type="promo_code",
        target_id=code,
        payload=promo_data,
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await db.commit()

    return {"status": "ok", "code": code}


@router.delete("/web/promos/{code}")
async def web_admin_delete_promo(
    code: str,
    request: Request,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a promo code."""
    from app.services.promo import PROMO_CODES

    code = code.upper()
    if code not in PROMO_CODES:
        admin_user_id, admin_email = _audit_actor(_admin)
        await log_admin_action(
            db,
            admin_user_id=admin_user_id,
            admin_email=admin_email,
            action="promo_deleted",
            target_type="promo_code",
            target_id=code,
            result="error",
            error_message="promo not found",
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        await db.commit()
        raise HTTPException(404, "Промокод не найден")

    del PROMO_CODES[code]
    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="promo_deleted",
        target_type="promo_code",
        target_id=code,
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await db.commit()
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
    request: Request,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Ban a user by database ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        admin_user_id, admin_email = _audit_actor(_admin)
        await log_admin_action(
            db,
            admin_user_id=admin_user_id,
            admin_email=admin_email,
            action="user_banned",
            target_type="user",
            target_id=str(user_id),
            payload={"reason": body.reason[:256]},
            result="error",
            error_message="user not found",
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        await db.commit()
        raise HTTPException(404, "User not found")

    user.is_banned = True
    user.ban_reason = body.reason[:256]
    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="user_banned",
        target_type="user",
        target_id=str(user.id),
        payload={"reason": user.ban_reason},
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
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
    request: Request,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Unban a user by database ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        admin_user_id, admin_email = _audit_actor(_admin)
        await log_admin_action(
            db,
            admin_user_id=admin_user_id,
            admin_email=admin_email,
            action="user_unbanned",
            target_type="user",
            target_id=str(user_id),
            result="error",
            error_message="user not found",
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        await db.commit()
        raise HTTPException(404, "User not found")

    user.is_banned = False
    user.ban_reason = None
    admin_user_id, admin_email = _audit_actor(_admin)
    await log_admin_action(
        db,
        admin_user_id=admin_user_id,
        admin_email=admin_email,
        action="user_unbanned",
        target_type="user",
        target_id=str(user.id),
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )
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


@router.get("/web/revenue-chart")
async def web_admin_revenue_chart(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=14, le=90),
):
    """Revenue chart data — daily revenue and transaction count."""
    start_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(
            cast(Transaction.created_at, Date).label("date"),
            func.sum(Transaction.amount_usd).label("revenue"),
            func.count().label("count"),
        )
        .where(
            Transaction.status == "completed",
            Transaction.created_at >= start_date,
        )
        .group_by(cast(Transaction.created_at, Date))
        .order_by(cast(Transaction.created_at, Date))
    )
    rows = result.all()

    # Fill gaps (days with no transactions)
    chart = []
    current = start_date
    row_map = {str(r.date): {"revenue": float(r.revenue or 0), "count": r.count} for r in rows}
    while current <= date.today():
        key = str(current)
        entry = row_map.get(key, {"revenue": 0, "count": 0})
        chart.append({
            "date": key,
            "revenue_usd": round(entry["revenue"], 2),
            "transactions": entry["count"],
        })
        current += timedelta(days=1)

    return {"chart": chart, "days": days}


@router.get("/web/user/{user_id}")
async def web_admin_user_detail(
    user_id: int,
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
):
    """Detailed user info for admin."""
    from app.models.daily_usage import DailyUsage

    user = await db.execute(select(User).where(User.id == user_id))
    user = user.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Recent usage (last 10)
    recent_usage = await db.execute(
        select(DailyUsage)
        .where(DailyUsage.user_tg_id == user.telegram_id)
        .order_by(DailyUsage.date.desc())
        .limit(10)
    )
    usage_rows = recent_usage.scalars().all()

    # Transactions
    txs = await db.execute(
        select(Transaction)
        .where(Transaction.user_tg_id == user.telegram_id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    tx_rows = txs.scalars().all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "telegram_id": user.telegram_id,
            "balance_usd": round(float(user.balance_usd or 0), 4),
            "subscription_tier": user.subscription_tier or "free",
            "credits_reset_date": user.credits_reset_date.isoformat() if user.credits_reset_date else None,
            "auth_provider": user.auth_provider,
            "joined_at": user.joined_at.isoformat() if user.joined_at else None,
            "is_banned": user.is_banned if hasattr(user, "is_banned") else False,
            "utm_source": getattr(user, "utm_source", None),
            "utm_medium": getattr(user, "utm_medium", None),
            "utm_campaign": getattr(user, "utm_campaign", None),
            "first_referrer": getattr(user, "first_referrer", None),
        },
        "recent_usage": [
            {"date": str(u.date), "fast": u.fast_used, "premium": u.premium_used, "opus": u.opus_used, "image": u.image_used, "video": u.video_used}
            for u in usage_rows
        ],
        "transactions": [
            {"amount_usd": round(float(t.amount_usd or 0), 2), "currency": t.currency, "status": t.status, "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in tx_rows
        ],
    }


# ═══════════════════════════════════════════
# Cost Analytics — P&L, per-user, per-model
# ════════════════════════════════���══════════

from app.models.video_task import VideoTask
from app.models.image_task import ImageTask
from app.models.threed_task import ThreeDTask


@router.get("/costs")
async def admin_costs(
    request: Request,
    _admin=Depends(require_web_admin),
    period: str = Query(default=None, description="YYYY-MM, defaults to current month"),
    db: AsyncSession = Depends(get_db),
):
    """Overall P&L: revenue vs provider costs."""
    start, end, normalized_period = _period_bounds(period)

    # Revenue from completed transactions
    rev_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_usd), 0))
        .where(Transaction.status == "completed", Transaction.created_at >= start, Transaction.created_at < end)
    )
    total_revenue = float(rev_result.scalar() or 0)

    # Provider costs from usage (chat)
    chat_result = await db.execute(
        select(
            func.coalesce(func.sum(Usage.provider_cost_usd), 0),
            func.count(),
        ).where(Usage.created_at >= start, Usage.created_at < end)
    )
    chat_row = chat_result.one()
    chat_cost = float(chat_row[0])
    chat_count = int(chat_row[1])

    # Video costs
    video_result = await db.execute(
        select(
            func.coalesce(func.sum(VideoTask.provider_cost_usd), 0),
            func.coalesce(func.sum(VideoTask.cost_usd), 0),
            func.count(),
        ).where(
            VideoTask.created_at >= start,
            VideoTask.created_at < end,
            VideoTask.fal_request_id.isnot(None),
        )
    )
    video_row = video_result.one()
    video_provider_cost = float(video_row[0])
    video_revenue = float(video_row[1])
    video_count = int(video_row[2])

    # Image costs
    image_result = await db.execute(
        select(
            func.coalesce(func.sum(ImageTask.provider_cost_usd), 0),
            func.coalesce(func.sum(ImageTask.cost_usd), 0),
            func.count(),
        ).where(
            ImageTask.created_at >= start,
            ImageTask.created_at < end,
            ImageTask.provider_cost_usd > 0,
        )
    )
    image_row = image_result.one()
    image_provider_cost = float(image_row[0])
    image_revenue = float(image_row[1])
    image_count = int(image_row[2])

    total_provider_cost = chat_cost + video_provider_cost + image_provider_cost
    margin = total_revenue - total_provider_cost
    margin_pct = round((margin / total_revenue * 100), 1) if total_revenue > 0 else 0

    return {
        "period": normalized_period,
        "total_revenue_usd": round(total_revenue, 2),
        "total_provider_cost_usd": round(total_provider_cost, 4),
        "gross_margin_usd": round(margin, 2),
        "margin_percent": margin_pct,
        "breakdown": {
            "chat": {"provider_cost": round(chat_cost, 4), "requests": chat_count},
            "video": {"revenue": round(video_revenue, 2), "provider_cost": round(video_provider_cost, 4), "requests": video_count},
            "image": {"revenue": round(image_revenue, 2), "provider_cost": round(image_provider_cost, 4), "requests": image_count},
        },
    }


@router.get("/costs/users")
async def admin_costs_users(
    request: Request,
    _admin=Depends(require_web_admin),
    period: str | None = Query(default=None, description="Optional: today, YYYY-MM, or YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    """Per-user profitability: revenue vs provider cost."""
    start, end, _ = _period_bounds(period) if period else (None, None, "")

    # Revenue per user (from transactions)
    rev_query = (
        select(
            Transaction.user_tg_id,
            func.sum(Transaction.amount_usd).label("total_paid"),
        )
        .where(Transaction.status == "completed")
        .group_by(Transaction.user_tg_id)
    )
    if start and end:
        rev_query = rev_query.where(Transaction.created_at >= start, Transaction.created_at < end)
    rev_rows = (await db.execute(rev_query)).all()
    user_revenue = {row[0]: float(row[1] or 0) for row in rev_rows}

    # Provider cost per user from chat/audio usage
    usage_cost_query = (
        select(
            Usage.user_tg_id,
            func.sum(Usage.provider_cost_usd).label("total_cost"),
            func.count().label("total_requests"),
        )
        .group_by(Usage.user_tg_id)
    )
    if start and end:
        usage_cost_query = usage_cost_query.where(Usage.created_at >= start, Usage.created_at < end)
    usage_rows = (await db.execute(usage_cost_query)).all()

    video_cost_query = (
        select(
            VideoTask.user_tg_id,
            func.sum(VideoTask.provider_cost_usd).label("total_cost"),
            func.count().label("total_requests"),
        )
        .where(VideoTask.fal_request_id.isnot(None))
        .group_by(VideoTask.user_tg_id)
    )
    if start and end:
        video_cost_query = video_cost_query.where(VideoTask.created_at >= start, VideoTask.created_at < end)
    video_rows = (await db.execute(video_cost_query)).all()

    image_cost_query = (
        select(
            ImageTask.user_tg_id,
            func.sum(ImageTask.provider_cost_usd).label("total_cost"),
            func.count().label("total_requests"),
        )
        .where(ImageTask.provider_cost_usd > 0)
        .group_by(ImageTask.user_tg_id)
    )
    if start and end:
        image_cost_query = image_cost_query.where(ImageTask.created_at >= start, ImageTask.created_at < end)
    image_rows = (await db.execute(image_cost_query)).all()

    user_costs: dict[int, dict[str, float | int]] = {}

    def _merge_cost_rows(rows):
        for row in rows:
            tg_id = int(row[0])
            bucket = user_costs.setdefault(tg_id, {"cost": 0.0, "requests": 0})
            bucket["cost"] = float(bucket["cost"]) + float(row[1] or 0)
            bucket["requests"] = int(bucket["requests"]) + int(row[2] or 0)

    _merge_cost_rows(usage_rows)
    _merge_cost_rows(video_rows)
    _merge_cost_rows(image_rows)

    # Merge with user info
    all_tg_ids = set(user_revenue.keys()) | set(user_costs.keys())
    if not all_tg_ids:
        return {"users": []}

    users_result = await db.execute(
        select(User.telegram_id, User.username, User.first_name, User.subscription_tier)
        .where(User.telegram_id.in_(all_tg_ids))
    )
    users_map = {row[0]: {"username": row[1], "first_name": row[2], "plan": row[3]} for row in users_result.all()}

    result = []
    for tg_id in all_tg_ids:
        paid = user_revenue.get(tg_id, 0)
        cost_data = user_costs.get(tg_id, {"cost": 0, "requests": 0})
        provider_cost = cost_data["cost"]
        margin = paid - provider_cost
        user_info = users_map.get(tg_id, {})
        result.append({
            "tg_id": tg_id,
            "username": user_info.get("username", ""),
            "first_name": user_info.get("first_name", ""),
            "plan": user_info.get("plan", "free"),
            "total_paid_usd": round(paid, 2),
            "total_provider_cost_usd": round(provider_cost, 4),
            "total_requests": cost_data["requests"],
            "margin_usd": round(margin, 2),
            "margin_percent": round(margin / paid * 100, 1) if paid > 0 else 0,
        })

    result.sort(key=lambda x: x["total_provider_cost_usd"], reverse=True)
    return {"users": result}


@router.get("/costs/models")
async def admin_costs_models(
    request: Request,
    _admin=Depends(require_web_admin),
    period: str | None = Query(default=None, description="Optional: today, YYYY-MM, or YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    """Per-model cost breakdown."""
    start, end, _ = _period_bounds(period) if period else (None, None, "")

    usage_query = (
        select(
            Usage.model_id,
            func.count().label("requests"),
            func.coalesce(func.sum(Usage.provider_cost_usd), 0).label("total_cost"),
            func.coalesce(func.sum(Usage.tokens_in), 0).label("total_tokens_in"),
            func.coalesce(func.sum(Usage.tokens_out), 0).label("total_tokens_out"),
        )
        .group_by(Usage.model_id)
    )
    if start and end:
        usage_query = usage_query.where(Usage.created_at >= start, Usage.created_at < end)
    usage_rows = (await db.execute(usage_query)).all()

    video_query = (
        select(
            VideoTask.model_id,
            func.count().label("requests"),
            func.coalesce(func.sum(VideoTask.provider_cost_usd), 0).label("total_cost"),
        )
        .where(VideoTask.fal_request_id.isnot(None))
        .group_by(VideoTask.model_id)
    )
    if start and end:
        video_query = video_query.where(VideoTask.created_at >= start, VideoTask.created_at < end)
    video_rows = (await db.execute(video_query)).all()

    image_query = (
        select(
            ImageTask.model_id,
            func.count().label("requests"),
            func.coalesce(func.sum(ImageTask.provider_cost_usd), 0).label("total_cost"),
        )
        .where(ImageTask.provider_cost_usd > 0)
        .group_by(ImageTask.model_id)
    )
    if start and end:
        image_query = image_query.where(ImageTask.created_at >= start, ImageTask.created_at < end)
    image_rows = (await db.execute(image_query)).all()

    models: dict[str, dict[str, float | int]] = {}

    for row in usage_rows:
        models[row[0]] = {
            "requests": int(row[1] or 0),
            "total_provider_cost_usd": float(row[2] or 0),
            "total_tokens_in": int(row[3] or 0),
            "total_tokens_out": int(row[4] or 0),
        }

    def _merge_model_rows(rows):
        for row in rows:
            model_id = row[0]
            bucket = models.setdefault(
                model_id,
                {
                    "requests": 0,
                    "total_provider_cost_usd": 0.0,
                    "total_tokens_in": 0,
                    "total_tokens_out": 0,
                },
            )
            bucket["requests"] = int(bucket["requests"]) + int(row[1] or 0)
            bucket["total_provider_cost_usd"] = float(bucket["total_provider_cost_usd"]) + float(row[2] or 0)

    _merge_model_rows(video_rows)
    _merge_model_rows(image_rows)

    rows = sorted(models.items(), key=lambda item: float(item[1]["total_provider_cost_usd"]), reverse=True)

    return {
        "models": [
            {
                "model_id": model_id,
                "requests": int(data["requests"]),
                "total_provider_cost_usd": round(float(data["total_provider_cost_usd"]), 4),
                "avg_cost_per_request": round(float(data["total_provider_cost_usd"]) / int(data["requests"]), 6) if int(data["requests"]) > 0 else 0,
                "total_tokens_in": int(data["total_tokens_in"]),
                "total_tokens_out": int(data["total_tokens_out"]),
            }
            for model_id, data in rows
        ],
    }
