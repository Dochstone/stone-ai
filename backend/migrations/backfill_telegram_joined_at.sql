WITH first_seen AS (
    SELECT user_tg_id, min(first_seen) AS first_seen
    FROM (
        SELECT user_tg_id, min(created_at) AS first_seen FROM usage GROUP BY user_tg_id
        UNION ALL
        SELECT user_tg_id, min(created_at) AS first_seen FROM transactions GROUP BY user_tg_id
        UNION ALL
        SELECT user_tg_id, min(created_at) AS first_seen FROM daily_usage GROUP BY user_tg_id
        UNION ALL
        SELECT user_tg_id, min(created_at) AS first_seen FROM chat_sessions GROUP BY user_tg_id
    ) events
    GROUP BY user_tg_id
)
UPDATE users AS u
SET
    joined_at = first_seen.first_seen,
    auth_provider = COALESCE(u.auth_provider, 'telegram'),
    linked_providers = CASE
        WHEN COALESCE(u.linked_providers, '') = '' THEN 'telegram'
        ELSE u.linked_providers
    END
FROM first_seen
WHERE u.telegram_id = first_seen.user_tg_id
  AND u.email IS NULL
  AND u.joined_at IS NULL;
