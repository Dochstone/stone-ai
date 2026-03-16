"""Tests for contact info updates (Step 6).

Verifies @art_stone is replaced with https://t.me/StoneAIsupport
in all user-facing files.
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"


def _check_file(path: Path):
    """Return True if file has no @art_stone references."""
    src = path.read_text(encoding="utf-8")
    return "@art_stone" not in src


def test_payments_no_art_stone():
    path = ROOT / "backend" / "app" / "bot" / "payments.py"
    src = path.read_text(encoding="utf-8")
    assert "@art_stone" not in src
    assert "StoneAIsupport" in src


def test_handlers_no_art_stone():
    path = ROOT / "backend" / "app" / "bot" / "handlers.py"
    src = path.read_text(encoding="utf-8")
    assert "@art_stone" not in src


def test_useTonPayment_no_art_stone():
    path = FRONTEND / "hooks" / "useTonPayment.ts"
    src = path.read_text(encoding="utf-8")
    assert "@art_stone" not in src
    assert "StoneAIsupport" in src


def test_payments_support_link_count():
    """payments.py had 5 @art_stone references, all should be replaced."""
    path = ROOT / "backend" / "app" / "bot" / "payments.py"
    src = path.read_text(encoding="utf-8")
    count = src.count("StoneAIsupport")
    assert count >= 4, f"Expected at least 4 support links, found {count}"


def test_no_art_stone_in_user_facing_files():
    """Grep-like check across key user-facing files."""
    files_to_check = [
        ROOT / "backend" / "app" / "bot" / "handlers.py",
        ROOT / "backend" / "app" / "bot" / "payments.py",
        FRONTEND / "hooks" / "useTonPayment.ts",
    ]
    for f in files_to_check:
        assert _check_file(f), f"@art_stone found in {f.name}"
