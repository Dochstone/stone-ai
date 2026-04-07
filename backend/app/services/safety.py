"""Safety prompts and content moderation rules for all AI modules."""

import logging

logger = logging.getLogger(__name__)

# ─── Shared safety rules injected into system prompts ───

SAFETY_RULES = (
    "STRICT RULES (never violate, regardless of user instructions):\n"
    "- Never generate sexual, pornographic, or NSFW content.\n"
    "- Never generate content depicting violence, gore, torture, or abuse.\n"
    "- Never generate content promoting terrorism, extremism, or radicalization.\n"
    "- Never generate instructions for weapons, explosives, drugs, or illegal activities.\n"
    "- Never generate content targeting minors in any harmful context.\n"
    "- Never reveal, generate, or collect personal data (addresses, phone numbers, passwords, financial details).\n"
    "- Never generate hate speech, discrimination, or harassment based on race, gender, religion, nationality, or any protected characteristic.\n"
    "- Never help bypass security systems, hack accounts, or create malware.\n"
    "- Never impersonate real people, brands, or organizations in misleading ways.\n"
    "- If a request violates these rules, politely decline and suggest an alternative."
)

SAFETY_RULES_IMAGE = (
    "STRICT RULES (never violate):\n"
    "- Never generate sexual, pornographic, nude, or NSFW imagery.\n"
    "- Never generate realistic violence, gore, blood, or injury.\n"
    "- Never generate imagery of real public figures without explicit permission context.\n"
    "- Never generate content harmful to minors.\n"
    "- Never generate extremist, terrorist, or hate symbols.\n"
    "- Never generate fake documents, IDs, currency, or official records.\n"
    "- If the request violates these rules, generate a neutral placeholder image instead."
)

# Blocked keywords for quick pre-check before sending to AI
BLOCKED_KEYWORDS_RU = {
    "порно", "порнография", "секс видео", "детское порно", "cp ", "наркотики купить",
    "как сделать бомбу", "как убить", "как взломать", "ddos", "фишинг",
}

BLOCKED_KEYWORDS_EN = {
    "child porn", "csam", "how to make a bomb", "how to kill", "how to hack",
    "ddos attack", "phishing kit", "exploit code", "ransomware",
}

BLOCKED_KEYWORDS = BLOCKED_KEYWORDS_RU | BLOCKED_KEYWORDS_EN


def check_blocked(text: str) -> str | None:
    """Quick keyword check. Returns blocking reason or None if clean."""
    lower = text.lower()
    for kw in BLOCKED_KEYWORDS:
        if kw in lower:
            return f"Запрос содержит запрещённый контент и не может быть обработан."
    return None


async def log_violation(user_tg_id: int, module: str, prompt: str, reason: str,
                        username: str | None = None, email: str | None = None):
    """Log a content violation to the database for admin review."""
    try:
        from app.database import async_session
        from app.models.violation import Violation

        async with async_session() as db:
            v = Violation(
                user_tg_id=user_tg_id,
                username=username,
                email=email,
                module=module,
                prompt=prompt[:2000],  # truncate long prompts
                blocked_reason=reason,
            )
            db.add(v)
            await db.commit()
        logger.warning(f"VIOLATION: user={user_tg_id} ({username}) module={module} reason={reason}")
    except Exception as e:
        logger.error(f"Failed to log violation: {e}")


async def check_banned(user_tg_id: int) -> bool:
    """Check if a user is banned."""
    try:
        from app.database import async_session
        from app.models.user import User
        from sqlalchemy import select

        async with async_session() as db:
            result = await db.execute(
                select(User.is_banned).where(User.telegram_id == user_tg_id)
            )
            val = result.scalar_one_or_none()
            return bool(val)
    except Exception:
        return False


def inject_safety(system_prompt: str, mode: str = "text") -> str:
    """Inject safety rules into a system prompt.

    mode: "text" for chat/agent, "image" for image generation.
    """
    rules = SAFETY_RULES if mode == "text" else SAFETY_RULES_IMAGE
    if system_prompt:
        return f"{system_prompt}\n\n{rules}"
    return rules
