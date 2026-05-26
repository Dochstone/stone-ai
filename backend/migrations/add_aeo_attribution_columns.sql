ALTER TABLE users
    ADD COLUMN IF NOT EXISTS utm_content VARCHAR(128),
    ADD COLUMN IF NOT EXISTS utm_term VARCHAR(128),
    ADD COLUMN IF NOT EXISTS first_landing_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS first_landing_url VARCHAR(700);

ALTER TABLE page_views
    ADD COLUMN IF NOT EXISTS utm_content VARCHAR(128),
    ADD COLUMN IF NOT EXISTS utm_term VARCHAR(128);

CREATE INDEX IF NOT EXISTS ix_page_views_utm_source_created
    ON page_views(utm_source, created_at DESC)
    WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_users_utm_source_joined
    ON users(utm_source, joined_at DESC)
    WHERE utm_source IS NOT NULL;
