"""Helpers for tracking which auth providers are linked to a user."""

from collections.abc import Iterable


PROVIDER_ORDER = ("email", "google", "yandex", "telegram")
KNOWN_PROVIDERS = set(PROVIDER_ORDER)


def parse_linked_providers(raw: str | None) -> list[str]:
    seen: set[str] = set()
    providers: list[str] = []
    for part in (raw or "").split(","):
        provider = part.strip().lower()
        if not provider or provider not in KNOWN_PROVIDERS or provider in seen:
            continue
        seen.add(provider)
        providers.append(provider)
    return providers


def serialize_linked_providers(providers: Iterable[str]) -> str:
    values = {provider.strip().lower() for provider in providers if provider}
    return ",".join(provider for provider in PROVIDER_ORDER if provider in values)


def get_linked_providers(user) -> list[str]:
    providers = set(parse_linked_providers(getattr(user, "linked_providers", None)))
    auth_provider = (getattr(user, "auth_provider", None) or "").strip().lower()
    telegram_id = getattr(user, "telegram_id", None)
    password_hash = getattr(user, "password_hash", None)

    if password_hash or auth_provider == "email":
        providers.add("email")
    if auth_provider == "google":
        providers.add("google")
    if auth_provider == "yandex":
        providers.add("yandex")
    if auth_provider == "telegram" or (isinstance(telegram_id, int) and telegram_id > 0):
        providers.add("telegram")

    return [provider for provider in PROVIDER_ORDER if provider in providers]


def legacy_auth_provider(providers: Iterable[str], fallback: str | None = None) -> str:
    provider_set = {provider for provider in providers if provider}
    if not provider_set:
        return fallback or "email"
    if provider_set == {"email"}:
        return "email"
    if provider_set == {"google"}:
        return "google"
    if provider_set == {"yandex"}:
        return "yandex"
    if provider_set == {"telegram"}:
        return "telegram"
    return "both"


def add_linked_providers(user, *providers: str) -> list[str]:
    combined = get_linked_providers(user)
    combined.extend(providers)
    user.linked_providers = serialize_linked_providers(combined)
    normalized = parse_linked_providers(user.linked_providers)
    user.auth_provider = legacy_auth_provider(normalized, getattr(user, "auth_provider", None))
    return normalized
