"""Tests for frontend ad integration (Этап 3).

Verifies:
- useRewardedAd hook exists with correct API
- AdBanner component exists with placement prop
- RewardedAdButton component exists
- i18n translations for ads in all 3 languages
- AdBanner integrated into HomeScreen and ChatScreen
- VITE_ADSGRAM_BLOCK_ID env var referenced
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"


# ─── useRewardedAd hook ───

def test_rewarded_ad_hook_exists():
    path = FRONTEND / "hooks" / "useRewardedAd.ts"
    assert path.exists()


def test_rewarded_ad_hook_api():
    src = (FRONTEND / "hooks" / "useRewardedAd.ts").read_text(encoding="utf-8")
    assert "showRewardedAd" in src
    assert "rewardedAdStatus" in src
    assert "rewardedAdLoading" in src
    assert "isRewardedAdAvailable" in src


def test_rewarded_ad_calls_backend():
    src = (FRONTEND / "hooks" / "useRewardedAd.ts").read_text(encoding="utf-8")
    assert "/api/payment/rewarded-ad-complete" in src


def test_rewarded_ad_adsgram_integration():
    src = (FRONTEND / "hooks" / "useRewardedAd.ts").read_text(encoding="utf-8")
    assert "Adsgram" in src
    assert "VITE_ADSGRAM_BLOCK_ID" in src
    assert "blockId" in src


def test_rewarded_ad_status_types():
    src = (FRONTEND / "hooks" / "useRewardedAd.ts").read_text(encoding="utf-8")
    for status in ["idle", "loading", "showing", "rewarded", "error", "already_claimed"]:
        assert f"'{status}'" in src


# ─── AdBanner component ───

def test_ad_banner_component_exists():
    path = FRONTEND / "components" / "AdBanner" / "AdBanner.tsx"
    assert path.exists()


def test_ad_banner_fetches_ads():
    src = (FRONTEND / "components" / "AdBanner" / "AdBanner.tsx").read_text(encoding="utf-8")
    assert "/api/ads" in src
    assert "placement" in src


def test_ad_banner_tracks_events():
    src = (FRONTEND / "components" / "AdBanner" / "AdBanner.tsx").read_text(encoding="utf-8")
    assert "/view" in src
    assert "/click" in src


def test_ad_banner_close_button():
    src = (FRONTEND / "components" / "AdBanner" / "AdBanner.tsx").read_text(encoding="utf-8")
    assert "handleClose" in src or "setVisible(false)" in src


# ─── RewardedAdButton component ───

def test_rewarded_button_component_exists():
    path = FRONTEND / "components" / "RewardedAdButton" / "RewardedAdButton.tsx"
    assert path.exists()


def test_rewarded_button_uses_hook():
    src = (FRONTEND / "components" / "RewardedAdButton" / "RewardedAdButton.tsx").read_text(encoding="utf-8")
    assert "useRewardedAd" in src
    assert "showRewardedAd" in src


def test_rewarded_button_updates_user_state():
    src = (FRONTEND / "components" / "RewardedAdButton" / "RewardedAdButton.tsx").read_text(encoding="utf-8")
    assert "setUser" in src
    assert "liteLimitDay" in src


# ─── i18n translations ───

def test_translations_rewarded_keys():
    src = (FRONTEND / "i18n" / "translations.ts").read_text(encoding="utf-8")
    keys = ["rewarded_button", "rewarded_loading", "rewarded_success",
            "rewarded_already", "rewarded_hint"]
    for key in keys:
        count = src.count(key)
        assert count >= 3, f"{key} appears {count} times, expected 3+ (en/ru/zh)"


# ─── Integration into screens ───

def test_home_screen_has_ad_banner():
    src = (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")
    assert "AdBanner" in src
    assert "home_banner" in src


def test_home_screen_has_rewarded_button():
    src = (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")
    assert "RewardedAdButton" in src


def test_chat_screen_has_ad_banner():
    src = (FRONTEND / "components" / "ChatScreen" / "ChatScreen.tsx").read_text(encoding="utf-8")
    assert "AdBanner" in src
    assert "chat_bottom" in src
