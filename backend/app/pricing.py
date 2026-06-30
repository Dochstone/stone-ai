"""Single source of truth for subscription tier prices in roubles.

Mirror of `website/lib/pricing.ts`. When you change a price here, also bump
the TypeScript constants so frontend and backend stay aligned.
"""

from datetime import datetime, timezone

PLAN_PRICES_RUB: dict[str, int] = {
    "mini": 990,
    "max": 1690,
    "max-pro": 3990,
}

# Explicit yearly prices — average ~20% off vs paying monthly. Per-month
# equivalents: 790 / 1 350 / 3 199 ₽.
PLAN_PRICES_YEARLY_RUB: dict[str, int] = {
    "mini": 9480,        # 790 × 12
    "max": 16200,        # 1 350 × 12
    "max-pro": 38388,    # 3 199 × 12
}

# Time-bound promo campaign. Auto-applies a fixed-rouble discount on a single
# tier's monthly price during the window. Mirror in `website/lib/pricing.ts`.
PROMO_CAMPAIGN: dict[str, object] = {
    "tier": "max",
    "discount_rub": 422,                     # 1690 → 1268 (−25%)
    "label_pct": 25,                         # marketed as "−25%"
    "valid_from": "2026-06-30T00:00:00+03:00",
    "valid_until": "2026-07-07T23:59:59+03:00",
}


def is_promo_active(now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)
    start = datetime.fromisoformat(str(PROMO_CAMPAIGN["valid_from"])).astimezone(timezone.utc)
    end = datetime.fromisoformat(str(PROMO_CAMPAIGN["valid_until"])).astimezone(timezone.utc)
    return start <= now <= end


def effective_plan_price(tier: str, period: str = "month") -> int:
    """Return checkout price in RUB with active campaign discount applied.

    Yearly prices are not discounted by this campaign — use raw mapping.
    """
    if period == "year":
        return PLAN_PRICES_YEARLY_RUB[tier]
    base = PLAN_PRICES_RUB[tier]
    if is_promo_active() and PROMO_CAMPAIGN["tier"] == tier:
        return max(1, base - int(PROMO_CAMPAIGN["discount_rub"]))
    return base
