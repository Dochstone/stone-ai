ALTER TABLE users
ADD COLUMN IF NOT EXISTS linked_providers VARCHAR(128) DEFAULT '';

UPDATE users
SET linked_providers = trim(both ',' from concat_ws(',',
    CASE
        WHEN password_hash IS NOT NULL OR auth_provider = 'email' THEN 'email'
        ELSE NULL
    END,
    CASE
        WHEN auth_provider = 'google' THEN 'google'
        ELSE NULL
    END,
    CASE
        WHEN auth_provider = 'yandex' THEN 'yandex'
        ELSE NULL
    END,
    CASE
        WHEN auth_provider = 'telegram' OR telegram_id > 0 THEN 'telegram'
        ELSE NULL
    END
))
WHERE linked_providers IS NULL OR linked_providers = '';
