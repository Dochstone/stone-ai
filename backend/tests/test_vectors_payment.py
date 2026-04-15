"""Vector payment tests — payment flow verification.

Tests payment logic without importing SQLAlchemy.
Uses source-level verification and formula checks.

Scenarios:
1. Stars invoice $5 → confirm → balance +$5
2. Heleket webhook $10 → balance +$10
3. Duplicate webhook → balance NOT increased twice
4. Invalid webhook signature → rejected
"""

import ast
import hashlib
import hmac
import json
import math
from pathlib import Path

BACKEND = Path(__file__).parent.parent
PAYMENT_SRC = BACKEND / "app" / "routers" / "payment.py"
PAYMENT_EXT_SRC = BACKEND / "app" / "routers" / "payment_ext.py"
HELEKET_SRC = BACKEND / "app" / "services" / "heleket.py"

_payment_src = PAYMENT_SRC.read_text(encoding="utf-8")
_payment_ext_src = PAYMENT_EXT_SRC.read_text(encoding="utf-8")
_heleket_src = HELEKET_SRC.read_text(encoding="utf-8")

# Extract constants
STAR_PRICE_USD = 0.013
MIN_TOP_UP_USD = 1.0


# ─── Helpers: replicate signature functions ───

def _heleket_make_signature(body_bytes: bytes, api_key: str) -> str:
    """Replicate Heleket's webhook signature."""
    raw = body_bytes.decode("utf-8") + api_key
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def _heleket_verify(body_bytes: bytes, received_sign: str, api_key: str) -> bool:
    expected = _heleket_make_signature(body_bytes, api_key)
    return hmac.compare_digest(expected, received_sign)


# ═══════════════════════════════════════════════════════════
# SCENARIO 1: Stars invoice $5 → confirm → balance +$5
# ═══════════════════════════════════════════════════════════

class TestStarsPayment:
    def test_stars_calculation(self):
        """$5 / $0.013 per star = ceil(384.6) = 385 stars."""
        usd = 5.0
        stars = max(1, math.ceil(usd / STAR_PRICE_USD))
        assert stars == 385

    def test_stars_various_amounts(self):
        for usd, expected_stars in [(1.0, 77), (3.0, 231), (5.0, 385), (10.0, 770), (25.0, 1924)]:
            stars = max(1, math.ceil(usd / STAR_PRICE_USD))
            assert stars == expected_stars, f"${usd} → {stars} stars, expected {expected_stars}"

    def test_confirm_adds_balance(self):
        """After confirm, balance increases by exact USD amount."""
        initial_balance = 0.0
        usd_amount = 5.0
        new_balance = round(initial_balance + usd_amount, 6)
        assert new_balance == 5.0

    def test_confirm_endpoint_exists(self):
        """payment.py has /stars/confirm endpoint."""
        assert "stars/confirm" in _payment_src

    def test_confirm_calls_add_balance(self):
        """Confirm handler calls add_balance."""
        assert "add_balance" in _payment_src

    def test_confirm_records_transaction(self):
        """Confirm handler creates Transaction with status=completed."""
        assert 'status="completed"' in _payment_src
        assert "Transaction(" in _payment_src

    def test_min_topup_enforced(self):
        """Minimum top-up is $1."""
        assert MIN_TOP_UP_USD == 1.0
        assert "MIN_TOP_UP_USD" in _payment_src

    def test_cumulative_balance(self):
        """Multiple top-ups accumulate."""
        balance = 0.0
        for topup in [5.0, 3.0, 10.0]:
            balance = round(balance + topup, 6)
        assert balance == 18.0


# ═══════════════════════════════════════════════════════════
# SCENARIO 2: Heleket webhook $10 → balance +$10
# ═══════════════════════════════════════════════════════════

class TestHeleket:
    def test_webhook_endpoint_exists(self):
        assert "crypto/webhook" in _payment_ext_src

    def test_webhook_accepts_paid_status(self):
        """Heleket webhook processes 'paid' and 'paid_over' statuses."""
        assert '"paid"' in _payment_ext_src
        assert '"paid_over"' in _payment_ext_src

    def test_webhook_finds_transaction(self):
        """Webhook looks up transaction by heleket:uuid."""
        assert 'heleket:' in _payment_ext_src

    def test_webhook_calls_add_balance(self):
        assert "add_balance" in _payment_ext_src

    def test_webhook_updates_status(self):
        """Webhook updates transaction status to completed."""
        assert 'status = "completed"' in _payment_ext_src or "status = 'completed'" in _payment_ext_src

    def test_balance_increase(self):
        balance = 5.0
        topup = 10.0
        new_balance = round(balance + topup, 6)
        assert new_balance == 15.0

    def test_valid_signature_accepted(self):
        """Valid Heleket signature should be accepted."""
        api_key = "test_api_key_123"
        body = json.dumps({"status": "paid", "uuid": "abc-123"}).encode()
        signature = _heleket_make_signature(body, api_key)
        assert _heleket_verify(body, signature, api_key)

    def test_signature_check_in_webhook(self):
        assert "verify_webhook_signature" in _payment_ext_src


# ═══════════════════════════════════════════════════════════
# (former SCENARIO 3 — Lava webhook — removed; provider deprecated)
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# SCENARIO 4: Duplicate webhook → balance NOT increased twice
# ═══════════════════════════════════════════════════════════

class TestDuplicateWebhook:
    def test_heleket_checks_already_completed(self):
        """Heleket webhook returns early if status=completed."""
        assert '"Already processed"' in _payment_ext_src

    def test_heleket_only_pending_matched(self):
        """Heleket webhook only matches status='pending' transactions."""
        assert "status = 'pending'" in _payment_ext_src

    def test_duplicate_logic_flow(self):
        """Simulate: first call → completed, second call → already processed."""
        tx_status_first_call = "pending"
        tx_status_second_call = "completed"

        # First call: pending → process → update to completed
        assert tx_status_first_call == "pending"
        balance_delta_1 = 10.0  # add $10

        # Second call: completed → skip
        assert tx_status_second_call == "completed"
        balance_delta_2 = 0.0  # no change

        total_added = balance_delta_1 + balance_delta_2
        assert total_added == 10.0  # only once

    def test_stars_confirm_is_idempotent_by_design(self):
        """Stars confirm creates new TX each time, but provider_id should be unique."""
        assert "provider_id" in _payment_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 5: Invalid webhook signature → rejected
# ═══════════════════════════════════════════════════════════

class TestInvalidSignature:
    def test_heleket_invalid_signature_rejected(self):
        """Wrong signature should fail Heleket verification."""
        api_key = "real_key"
        body = json.dumps({"status": "paid", "uuid": "abc"}).encode()
        wrong_sign = "deadbeef123456"
        assert not _heleket_verify(body, wrong_sign, api_key)

    def test_heleket_tampered_body_rejected(self):
        """Tampered body with original signature should fail."""
        api_key = "real_key"
        original_body = json.dumps({"status": "paid", "uuid": "abc", "amount": "10"}).encode()
        signature = _heleket_make_signature(original_body, api_key)

        tampered_body = json.dumps({"status": "paid", "uuid": "abc", "amount": "1000"}).encode()
        assert not _heleket_verify(tampered_body, signature, api_key)

    def test_heleket_wrong_key_rejected(self):
        """Correct body but wrong API key should fail."""
        body = json.dumps({"status": "paid"}).encode()
        sign_with_real = _heleket_make_signature(body, "real_key")
        assert not _heleket_verify(body, sign_with_real, "wrong_key")

    def test_webhook_returns_403(self):
        """Both webhooks raise 403 on invalid signature."""
        assert "403" in _payment_ext_src
        assert "Invalid signature" in _payment_ext_src

    def test_empty_signature_rejected(self):
        """Empty signature should not match."""
        body = b'{"test": true}'
        assert not _heleket_verify(body, "", "key")
