ALTER TABLE page_views
    ADD COLUMN IF NOT EXISTS ref_code VARCHAR(32),
    ADD COLUMN IF NOT EXISTS utm_source VARCHAR(64),
    ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(64),
    ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(128);

CREATE INDEX IF NOT EXISTS ix_page_views_ref_code ON page_views(ref_code) WHERE ref_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_page_views_ref_created ON page_views(ref_code, created_at DESC) WHERE ref_code IS NOT NULL;

GRANT ALL PRIVILEGES ON TABLE page_views TO stoneai;
