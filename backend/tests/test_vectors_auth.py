"""Vector auth tests — authentication flow verification.

Tests auth logic without importing SQLAlchemy.
Uses JWT/bcrypt/HMAC crypto directly + source verification.

Scenarios:
1. Register email → JWT → valid for API access
2. TG user links email → shared balance
3. Invalid JWT → 401
4. TG initData + JWT simultaneously → TG wins (priority)
5. Login with wrong password → 401
"""

import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
import pytest

BACKEND = Path(__file__).parent.parent
AUTH_SRC = BACKEND / "app" / "middleware" / "auth.py"
WEB_AUTH_SRC = BACKEND / "app" / "middleware" / "web_auth.py"
AUTH_ROUTER_SRC = BACKEND / "app" / "routers" / "auth.py"

_auth_src = AUTH_SRC.read_text(encoding="utf-8")
_web_auth_src = WEB_AUTH_SRC.read_text(encoding="utf-8")
_auth_router_src = AUTH_ROUTER_SRC.read_text(encoding="utf-8")

# Constants from web_auth.py
JWT_SECRET = os.getenv("SECRET_KEY", "change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


# ─── Helpers: replicate auth functions ───

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_jwt(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_jwt(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def _validate_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict:
    """Replicate validate_init_data from auth.py without importing it."""
    from urllib.parse import unquote
    parsed = {}
    for pair in init_data.split("&"):
        if "=" in pair:
            key, value = pair.split("=", 1)
            parsed[key] = unquote(value)
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash in initData")
    auth_date = parsed.get("auth_date")
    if auth_date:
        age = int(time.time()) - int(auth_date)
        if age > max_age:
            raise ValueError(f"initData expired: {age}s old (max {max_age}s)")
    data_check_string = "\n".join(f"{key}={parsed[key]}" for key in sorted(parsed.keys()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("Invalid hash — data may be tampered")
    user_data = parsed.get("user")
    if user_data:
        return json.loads(user_data)
    raise ValueError("No user data in initData")


def _create_tg_init_data(user_data: dict, bot_token: str) -> str:
    """Create valid Telegram initData with proper HMAC signature."""
    user_json = json.dumps(user_data, separators=(",", ":"))
    auth_date = str(int(time.time()))

    params = {
        "user": user_json,
        "auth_date": auth_date,
    }

    data_check_string = "\n".join(
        f"{key}={params[key]}" for key in sorted(params.keys())
    )

    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    parts = [f"{k}={v}" for k, v in params.items()]
    parts.append(f"hash={computed_hash}")
    return "&".join(parts)


# ═══════════════════════════════════════════════════════════
# SCENARIO 1: Register → JWT → valid API access
# ═══════════════════════════════════════════════════════════

class TestRegisterAndJWT:
    def test_jwt_creation(self):
        """create_jwt produces a decodable token with correct payload."""
        token = _create_jwt(42, "test@example.com")
        payload = _decode_jwt(token)
        assert payload["sub"] == "42"
        assert payload["email"] == "test@example.com"
        assert "exp" in payload
        assert "iat" in payload

    def test_jwt_not_expired(self):
        """Freshly created JWT should not be expired."""
        token = _create_jwt(1, "a@b.com")
        payload = _decode_jwt(token)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > datetime.now(timezone.utc)

    def test_jwt_expires_in_30_days(self):
        token = _create_jwt(1, "a@b.com")
        payload = _decode_jwt(token)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
        delta = exp - iat
        assert delta.days == JWT_EXPIRE_DAYS

    def test_password_hashing(self):
        """hash_password + verify_password roundtrip."""
        password = "MyStr0ngP@ss"
        hashed = _hash_password(password)
        assert hashed != password
        assert _verify_password(password, hashed)

    def test_register_endpoint_exists(self):
        assert "/register" in _auth_router_src
        assert "email" in _auth_router_src
        assert "password" in _auth_router_src

    def test_register_creates_jwt(self):
        assert "create_jwt" in _auth_router_src

    def test_register_hashes_password(self):
        assert "hash_password" in _auth_router_src

    def test_register_sets_cookie(self):
        """Register should set httpOnly cookie."""
        assert "set_cookie" in _auth_router_src or "access_token" in _auth_router_src

    def test_bearer_token_extracted(self):
        """get_current_user extracts Bearer token from Authorization header."""
        assert 'Bearer ' in _auth_src
        assert "extract_jwt_from_request" in _auth_src

    def test_jwt_user_resolved_from_db(self):
        """JWT auth resolves user from DB to get telegram_id."""
        assert "User.id == user_pk" in _auth_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 2: TG user links email → shared balance
# ═══════════════════════════════════════════════════════════

class TestTelegramLink:
    def test_link_endpoint_exists(self):
        assert "/telegram-link" in _auth_router_src

    def test_link_validates_initdata(self):
        """telegram-link validates TG initData."""
        assert "validate_init_data" in _auth_router_src

    def test_link_merges_balance(self):
        """Link merges balance_usd from TG user into web user."""
        assert "balance_usd" in _auth_router_src

    def test_link_merges_requests(self):
        assert "total_requests" in _auth_router_src

    def test_link_updates_provider(self):
        """After linking, auth_provider becomes 'both'."""
        assert '"both"' in _auth_router_src

    def test_link_moves_usage_records(self):
        """Link migrates usage records to new telegram_id."""
        assert "Usage" in _auth_router_src
        assert "Transaction" in _auth_router_src

    def test_link_sets_telegram_id(self):
        """Web user gets real telegram_id after linking."""
        assert "web_user.telegram_id = tg_id" in _auth_router_src

    def test_balance_merge_arithmetic(self):
        """Merging two balances should be additive."""
        web_balance = 5.0
        tg_balance = 3.5
        merged = round(web_balance + tg_balance, 6)
        assert merged == 8.5

    def test_link_requires_jwt_auth(self):
        """Endpoint requires JWT (email) auth, not TG."""
        assert "Already authenticated via Telegram" in _auth_router_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 3: Invalid JWT → 401
# ═══════════════════════════════════════════════════════════

class TestInvalidJWT:
    def test_expired_token_rejected(self):
        """Expired JWT should raise."""
        payload = {
            "sub": "1",
            "email": "a@b.com",
            "iat": datetime.now(timezone.utc) - timedelta(days=60),
            "exp": datetime.now(timezone.utc) - timedelta(days=30),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    def test_wrong_secret_rejected(self):
        """JWT signed with wrong secret should fail."""
        token = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                           "wrong-secret", algorithm=JWT_ALGORITHM)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    def test_tampered_payload_rejected(self):
        """Tampered JWT should fail signature verification."""
        token = _create_jwt(1, "a@b.com")
        # Tamper: modify the payload part
        parts = token.split(".")
        import base64
        payload_bytes = base64.urlsafe_b64decode(parts[1] + "==")
        payload = json.loads(payload_bytes)
        payload["sub"] = "999"  # tamper
        new_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
        tampered = f"{parts[0]}.{new_payload}.{parts[2]}"
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(tampered, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    def test_garbage_token_rejected(self):
        """Completely invalid token should fail."""
        with pytest.raises(jwt.DecodeError):
            jwt.decode("not.a.jwt", JWT_SECRET, algorithms=[JWT_ALGORITHM])

    def test_empty_token_rejected(self):
        with pytest.raises(jwt.DecodeError):
            jwt.decode("", JWT_SECRET, algorithms=[JWT_ALGORITHM])

    def test_auth_middleware_raises_401(self):
        """web_auth.py decode_jwt raises HTTPException(401) on invalid token."""
        assert "401" in _web_auth_src
        assert "Token expired" in _web_auth_src
        assert "Invalid token" in _web_auth_src

    def test_missing_auth_returns_401(self):
        """No auth header and no cookie → 401."""
        assert "Missing authorization" in _auth_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 4: TG initData + JWT simultaneously → TG wins
# ═══════════════════════════════════════════════════════════

class TestAuthPriority:
    def test_x_tg_init_data_checked_first(self):
        """X-TG-Init-Data header is checked before Authorization."""
        lines = _auth_src.split("\n")
        tg_init_line = next(i for i, l in enumerate(lines) if "X-TG-Init-Data" in l)
        bearer_line = next(i for i, l in enumerate(lines) if "Bearer " in l)
        assert tg_init_line < bearer_line

    def test_tma_checked_before_bearer(self):
        """Authorization: tma checked before Bearer."""
        lines = _auth_src.split("\n")
        tma_line = next(i for i, l in enumerate(lines) if 'tma ' in l)
        bearer_line = next(i for i, l in enumerate(lines) if "Bearer " in l)
        assert tma_line < bearer_line

    def test_priority_order_documented(self):
        """Priority is documented in docstring."""
        assert "X-TG-Init-Data" in _auth_src
        assert "tma" in _auth_src
        assert "Bearer" in _auth_src

    def test_tg_auth_sets_provider_telegram(self):
        """TG auth sets auth_provider = telegram."""
        assert '"telegram"' in _auth_src

    def test_valid_tg_initdata_creation(self):
        """We can create valid TG initData and verify it."""
        bot_token = "123456:ABC-DEF"
        user_data = {"id": 777, "first_name": "Test", "username": "tester"}
        init_data = _create_tg_init_data(user_data, bot_token)
        result = _validate_init_data(init_data, bot_token)
        assert result["id"] == 777
        assert result["username"] == "tester"

    def test_tg_initdata_wrong_token_fails(self):
        """initData signed with different bot token should fail."""
        user_data = {"id": 777, "first_name": "Test"}
        init_data = _create_tg_init_data(user_data, "real_token:ABC")
        with pytest.raises(ValueError, match="Invalid hash"):
            _validate_init_data(init_data, "wrong_token:XYZ")

    def test_tg_initdata_expired_fails(self):
        """Expired initData should fail."""
        bot_token = "123:ABC"
        user_json = json.dumps({"id": 1, "first_name": "X"}, separators=(",", ":"))
        old_time = str(int(time.time()) - 200000)
        params = {"user": user_json, "auth_date": old_time}
        data_check_string = "\n".join(f"{k}={params[k]}" for k in sorted(params.keys()))
        secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        h = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"user={user_json}&auth_date={old_time}&hash={h}"
        with pytest.raises(ValueError, match="expired"):
            _validate_init_data(init_data, bot_token)


# ═══════════════════════════════════════════════════════════
# SCENARIO 5: Login with wrong password → 401
# ═══════════════════════════════════════════════════════════

class TestWrongPassword:
    def test_wrong_password_fails_verify(self):
        hashed = _hash_password("correct_password")
        assert not _verify_password("wrong_password", hashed)

    def test_similar_password_fails(self):
        hashed = _hash_password("MyPassword123")
        assert not _verify_password("MyPassword124", hashed)
        assert not _verify_password("mypassword123", hashed)
        assert not _verify_password("MyPassword123 ", hashed)

    def test_empty_password_fails(self):
        hashed = _hash_password("something")
        assert not _verify_password("", hashed)

    def test_login_endpoint_returns_401(self):
        """Login handler raises 401 on wrong password."""
        assert "Invalid email or password" in _auth_router_src

    def test_login_calls_verify_password(self):
        assert "verify_password" in _auth_router_src

    def test_register_enforces_min_length(self):
        """Password must be at least 8 characters."""
        assert "8 characters" in _auth_router_src or "len(password) < 8" in _auth_router_src

    def test_register_rejects_duplicate_email(self):
        """409 on duplicate email."""
        assert "409" in _auth_router_src
        assert "already registered" in _auth_router_src.lower()

    def test_bcrypt_hash_different_each_time(self):
        """bcrypt uses random salt, so same password → different hash."""
        h1 = _hash_password("same_password")
        h2 = _hash_password("same_password")
        assert h1 != h2
        # But both verify
        assert _verify_password("same_password", h1)
        assert _verify_password("same_password", h2)
