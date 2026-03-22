"""Login streak tracking — daily login bonuses."""

from datetime import datetime, timezone

STREAK_BONUSES = {
    2: {"fast": 2, "images": 0, "premium": 0},
    7: {"fast": 5, "images": 1, "premium": 0},
    30: {"fast": 5, "images": 1, "premium": 5},  # 5 one-time premium requests as bonus
}


async def update_login_streak(db, user) -> dict:
    """Call on every successful login/auth. Updates streak and bonuses."""
    today = datetime.now(timezone.utc).date()

    if user.last_login_date == today:
        return {"streak": user.login_streak, "bonuses": {}, "new_bonus": False}

    if user.last_login_date and (today - user.last_login_date).days == 1:
        user.login_streak = (user.login_streak or 0) + 1
    else:
        user.login_streak = 1

    user.last_login_date = today

    # Reset daily counters
    user.daily_fast_used = 0
    user.daily_premium_used = 0
    user.daily_image_used = 0

    # Apply bonuses based on streak
    user.streak_bonus_fast = 0
    user.streak_bonus_images = 0

    for threshold, bonuses in sorted(STREAK_BONUSES.items()):
        if user.login_streak >= threshold:
            user.streak_bonus_fast = bonuses["fast"]
            user.streak_bonus_images = bonuses["images"]

    await db.flush()

    return {
        "streak": user.login_streak,
        "bonuses": {"fast": user.streak_bonus_fast, "images": user.streak_bonus_images, "video": user.streak_bonus_video},
        "new_bonus": user.login_streak in STREAK_BONUSES,
    }
