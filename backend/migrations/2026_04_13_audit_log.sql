CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL,
    admin_email VARCHAR(255),
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(40),
    target_id VARCHAR(100),
    payload JSONB,
    result VARCHAR(20) NOT NULL DEFAULT 'ok' CHECK (result IN ('ok', 'error', 'denied')),
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

-- App user needs full DML + sequence access (migrations are run as postgres superuser).
GRANT ALL PRIVILEGES ON TABLE admin_audit_log TO stoneai;
GRANT USAGE, SELECT ON SEQUENCE admin_audit_log_id_seq TO stoneai;
