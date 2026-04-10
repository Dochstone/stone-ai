# Stone AI — Security Audit Report

> Date: 2026-04-11
> Audited by: Claude Code (Sonnet 4.6)
> Scope: Payments, Auth, Billing/Limits, Hardcoded Secrets

---

## CRITICAL (fix immediately — money loss / account takeover)

### 1. Stars endpoint has NO authentication
**File:** `backend/app/routers/payment.py` lines 80-115
**Issue:** `/api/payment/stars/confirm` takes `tg_id` and `usd_amount` as parameters with no auth check. Anyone can call it and credit any user's balance.
```python
@router.post("/stars/confirm")
async def confirm_stars_payment(
    tg_id: int,
    usd_amount: float,
    payment_id: str,
    db: AsyncSession = Depends(get_db),
):
    new_balance = await add_balance(db, tg_id, usd_amount)
```
**Exploit:** `curl -X POST /api/payment/stars/confirm?tg_id=123456&usd_amount=1000&payment_id=fake`
**Fix:** Add bot token signature verification or make this endpoint internal-only (called only by Telegram webhook handler, not exposed via router).

---

### 2. Lava webhook signature verification is OPTIONAL
**File:** `backend/app/routers/payment_ext.py` lines 130-133
**Issue:** If `settings.lava_webhook_key` is empty/None, webhook is processed without any signature check.
```python
if settings.lava_webhook_key:  # ← conditional!
    if not lava_service.verify_webhook_signature(...):
        raise HTTPException(403, "Invalid signature")
```
**Fix:** Make verification mandatory. Raise error if webhook key is not configured:
```python
if not settings.lava_webhook_key:
    raise RuntimeError("LAVA_WEBHOOK_KEY is required")
if not lava_service.verify_webhook_signature(...):
    raise HTTPException(403, "Invalid signature")
```

---

### 3. Platega webhook has NO cryptographic signature
**File:** `backend/app/routers/payment_ext.py` lines 280-392
**Issue:** Platega webhook only compares `X-MerchantId` and `X-Secret` headers — plain string comparison, no HMAC. Headers can be forged. Even on failure, returns `{"ok": True}`.
```python
merchant_id = request.headers.get("X-MerchantId", "")
secret = request.headers.get("X-Secret", "")
if not platega_service.verify_webhook(merchant_id, secret):
    return {"ok": True}  # ← still returns OK!
```
**Fix:** Implement HMAC signature verification of request body. On failure, return 403, not 200.

---

### 4. Webhook replay — no idempotency protection (race condition)
**File:** `backend/app/routers/payment_ext.py` lines 144-182
**Issue:** Two simultaneous webhook calls for the same payment can both find the pending transaction and credit balance twice. No database-level lock.
```python
result = await db.execute(
    text("SELECT ... WHERE provider_id = :pid AND status = 'pending' LIMIT 1"), ...
)
# Both concurrent requests read same pending row → both credit balance
```
**Fix:** Use atomic UPDATE with RETURNING:
```sql
UPDATE transactions SET status = 'completed'
WHERE provider_id = :pid AND status = 'pending'
RETURNING id, user_tg_id, amount_usd
```
Only process if UPDATE affected exactly 1 row.

---

### 5. Subscription not persisted — flush() instead of commit()
**File:** `backend/app/routers/user.py` line 471
**Issue:** `/subscribe` endpoint uses `await db.flush()` but never calls `await db.commit()`. If connection drops or error occurs after response, subscription is rolled back.
```python
user.balance_usd = round(balance - price_usd, 6)
user.subscription_tier = req.tier
await db.flush()  # ← WRONG: not committed to DB!
```
**Fix:** Add `await db.commit()` after `await db.flush()`.

---

### 6. No transaction isolation in subscription purchase
**File:** `backend/app/routers/user.py` lines 439-471
**Issue:** Balance check and deduction are not atomic. No `with_for_update()` lock. Two concurrent requests can both pass the balance check.
```python
balance = float(user.balance_usd or 0)  # Read without lock
if balance < price_usd:                  # Check
    raise HTTPException(402, ...)
user.balance_usd = round(balance - price_usd, 6)  # Write — race condition!
```
**Fix:** Add row-level lock:
```python
result = await db.execute(
    select(User).where(User.id == user_id).with_for_update()
)
user = result.scalar_one()
```

---

### 7. Account takeover via /telegram-link
**File:** `backend/app/routers/auth.py` lines 534-619
**Issue:** Email-authenticated user can link ANY Telegram account without proving ownership. Attacker registers email account, then calls `/telegram-link` with victim's Telegram initData.
**Fix:** Require password re-confirmation + minimum account age (1 hour) before linking:
```python
if not verify_password(body.password, web_user.password_hash):
    raise HTTPException(401, "Invalid password")
age = (datetime.utcnow() - web_user.joined_at).total_seconds()
if age < 3600:
    raise HTTPException(400, "Wait 1 hour before linking")
```

---

## HIGH (fix today)

### 8. Race condition in daily limit checks
**File:** `backend/app/services/daily_limits.py` lines 280-346
**Issue:** `check_daily_limit()` and `increment_usage()` are not atomic. N concurrent requests can all pass the check before any increment happens, giving user N extra requests.
**Fix:** Use `SELECT ... FOR UPDATE` before modifying counters in `increment_usage()`.

---

### 9. Guest rate limit bypass via IP spoofing
**File:** `backend/app/routers/chat.py` lines 82, 143
**Issue:** Guest rate limiting reads `X-Real-IP` / `X-Forwarded-For` headers which are spoofable:
```python
ip = request.headers.get("X-Real-IP") or \
     request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
     (request.client.host if request.client else "unknown")
```
**Fix:** Only trust headers from known proxy IPs (Cloudflare, nginx). Otherwise use `request.client.host`.

---

### 10. Hardcoded SMTP credentials in email-proxy.py
**File:** `email-proxy.py` lines 9-13
**Exposed:**
```python
SMTP_HOST = "smtp.beget.com"
SMTP_PORT = 465
SMTP_EMAIL = "noreply@stoneai.ru"
SMTP_PASSWORD = "u58qbUsva9A@@"      # ← HARDCODED PASSWORD
API_KEY = "stoneai-email-secret-2026"  # ← HARDCODED API KEY
```
**Fix:** Move to environment variables. Rotate password immediately.

---

### 11. Hardcoded test account credentials
**Files:** `marketing/record_demo.py` line 27-28, `marketing/record_demo2.py` lines 35-36
**Exposed:**
```python
email = "dochstone@gmail.com"
password = "Asde123asd@"
```
**Fix:** Change password immediately. Use env vars for test credentials.

---

### 12. Email proxy API key has hardcoded fallback
**File:** `backend/app/services/email_service.py` line 13
```python
EMAIL_PROXY_KEY = os.getenv("EMAIL_PROXY_KEY", "stoneai-email-secret-2026")  # ← hardcoded default
```
**Fix:** Remove default: `os.getenv("EMAIL_PROXY_KEY", "")` — fail if not set.

---

### 13. Heleket webhook signature is optional
**File:** `backend/app/routers/payment_ext.py` lines 470-483
**Issue:** Same pattern as Lava — `if settings.heleket_api_key and received_sign:` makes verification conditional.
**Fix:** Make mandatory. Reject if signature missing.

---

### 14. TON comment matching uses only 12 hex chars
**File:** `backend/app/services/ton.py` lines 196-197
**Issue:** Payment comment format `SA-{sha256[:12]}` = 48-bit entropy. Brute-forceable.
**Fix:** Use full 32-char hash. Add amount + sender address verification.

---

### 15. Hardcoded TON wallet address in code
**File:** `backend/app/routers/payment_ext.py` line 678
```python
TON_MERCHANT_WALLET = "UQBfxl37Bgf7FVaO4prAM5YA0d9pfJdRL7hymmYZX01Skjc7"
```
**Fix:** Move to `settings.ton_wallet_address` (already exists in config). Remove hardcoded constant.

---

### 16. Verification code brute force
**File:** `backend/app/routers/auth.py` lines 197-205
**Issue:** 6-digit code = 1M combinations, 5 attempts per code. Attacker can request new codes repeatedly.
**Fix:** Add per-email+IP rate limiting: max 3 verification requests per 5 minutes. Add exponential backoff.

---

### 17. Subscription expiry not checked on every request
**File:** `backend/app/services/daily_limits.py` lines 21-54
**Issue:** `check_and_expire_subscription()` is called in video/image/audio routers but NOT in chat.py. Background loop runs every 24h. User can use expired subscription for up to 24 hours.
**Fix:** Call `check_and_expire_subscription()` in `check_can_request()` for every request where tier != "free".

---

## MEDIUM (fix this week)

### 18. Promo codes stored in memory — reset on PM2 restart
**File:** `backend/app/services/promo.py` line 57
**Issue:** `_promo_usage: dict[str, set[int]]` resets when server restarts. User can reuse promo codes.
**Fix:** Store promo usage in database.

---

### 19. TON orders stored in memory — race condition + memory leak
**File:** `backend/app/routers/payment_ext.py` lines 717-737
**Issue:** `_ton_orders` dict in memory. Concurrent `/ton-check` can double-confirm. No cleanup unless new order created.
**Fix:** Migrate to database with atomic UPDATE. Add periodic cleanup.

---

### 20. Telegram web sessions never cleaned up
**File:** `backend/app/routers/auth.py` lines 643-714
**Issue:** `_tg_web_sessions` in-memory dict. `_cleanup_old_sessions()` exists but is never called.
**Fix:** Call cleanup periodically or add to background tasks.

---

### 21. JWT SECRET_KEY not validated at startup
**File:** `backend/app/config.py` line 51
**Issue:** Empty SECRET_KEY only raises error when JWT is created, not at startup.
**Fix:** Validate at startup: `if not self.secret_key or len(self.secret_key) < 32: raise RuntimeError(...)`.

---

### 22. DEV_AUTH_BYPASS could be enabled in production
**File:** `backend/app/middleware/auth.py` lines 77-85
**Issue:** If `DEV_AUTH_BYPASS=true` and bot token is missing, all requests auth as hardcoded user ID 123456789.
**Fix:** Add production guard: `if os.getenv("ENVIRONMENT") == "production" and settings.dev_auth_bypass: raise RuntimeError(...)`.

---

### 23. Cookie SameSite=Lax instead of Strict
**File:** `backend/app/routers/auth.py` line 114
**Fix:** Change to `samesite="strict"` for better CSRF protection.

---

### 24. HMAC validation window too long (24 hours)
**File:** `backend/app/middleware/auth.py` lines 45-52
**Issue:** Telegram initData accepted for 86400 seconds (24h). Should be 10-15 minutes.
**Fix:** Reduce `max_age` to 600-900 seconds.

---

### 25. Placeholder Telegram ID collision
**File:** `backend/app/routers/auth.py` lines 216, 378
**Issue:** Email users get `placeholder_tg_id = -int(time.time() * 1000) % (2**53)`. Two registrations in same millisecond = collision.
**Fix:** Use `uuid.uuid4().int % (2**53)` for guaranteed uniqueness.

---

### 26. Guest usage dict never cleaned
**File:** `backend/app/routers/chat.py` lines 53-55
**Issue:** `_guest_usage: dict[str, int]` grows unbounded. Memory leak.
**Fix:** Add TTL-based cleanup or use Redis.

---

## BILLING NOTE: This is the intended billing model (NOT a bug)

**Chat** = subscription + daily limits only, no per-token charge. This is by design.
**Tools** (audio, video, image, 3D) = pay from USD balance per use.

This is confirmed working as intended.

---

## SECRETS TO ROTATE IMMEDIATELY

1. SMTP password: `u58qbUsva9A@@` (email-proxy.py)
2. Email API key: `stoneai-email-secret-2026` (email-proxy.py, email_service.py)
3. Test account password: `Asde123asd@` for `dochstone@gmail.com` (marketing scripts)

---

## FIX PRIORITY ORDER

### Phase 1 — Money (today):
1. Protect `/api/payment/stars/confirm` with auth
2. Make webhook signatures mandatory (Lava, Platega, Heleket)
3. Add idempotency to webhooks (atomic UPDATE)
4. Fix `flush()` → `commit()` in subscribe
5. Add `with_for_update()` in subscribe

### Phase 2 — Auth (today):
6. Fix `/telegram-link` — require password + account age
7. Fix guest IP spoofing
8. Add rate limiting on verification codes

### Phase 3 — Limits (this week):
9. Add `with_for_update()` in daily limits
10. Check subscription expiry on every request
11. Move promo usage to database
12. Move TON orders to database

### Phase 4 — Secrets (now):
13. Rotate SMTP password
14. Rotate email API key
15. Change test account password
16. Remove hardcoded TON wallet
17. Remove hardcoded defaults from email_service.py
