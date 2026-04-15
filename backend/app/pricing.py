"""Single source of truth for subscription tier prices in roubles.

Mirror of `website/lib/pricing.ts` `PRICES_CURRENT`. When you change a price
here, also bump the TypeScript constant so frontend and backend stay aligned.
"""

PLAN_PRICES_RUB: dict[str, int] = {
    "mini": 990,
    "max": 1890,
    "max-pro": 3990,
}
