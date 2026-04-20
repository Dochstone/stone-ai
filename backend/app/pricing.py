"""Single source of truth for subscription tier prices in roubles.

Mirror of `website/lib/pricing.ts`. When you change a price here, also bump
the TypeScript constants so frontend and backend stay aligned.
"""

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
