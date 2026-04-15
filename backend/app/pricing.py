"""Single source of truth for subscription tier prices in roubles.

Mirror of `website/lib/pricing.ts`. When you change a price here, also bump
the TypeScript constants so frontend and backend stay aligned.
"""

PLAN_PRICES_RUB: dict[str, int] = {
    "mini": 990,
    "max": 1890,
    "max-pro": 3990,
}

# Explicit yearly prices (X 990 style) — average ~20% off vs paying monthly.
PLAN_PRICES_YEARLY_RUB: dict[str, int] = {
    "mini": 9490,
    "max": 17990,
    "max-pro": 37990,
}
