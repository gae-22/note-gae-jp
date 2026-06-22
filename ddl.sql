-- ==============================================================================
-- 1. EXTENSIONS & SETTINGS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_bigm"; -- 日本語全文検索用(2-gram)

-- ステータス管理用のネイティブENUM型定義（型安全の徹底）
CREATE TYPE entry_status AS ENUM ('draft', 'published', 'archived');

-- ==============================================================================
-- 2. UTILITIES
-- ==============================================================================
-- 更新日時自動更新用の汎用関数
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES
-- ==============================================================================

-- ACCOUNTS: ユーザー管理
CREATE TABLE accounts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '名無し',
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMPTZ,

    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ENTRIES: 日記エントリー
CREATE TABLE entries (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    status     entry_status NOT NULL DEFAULT 'draft',
    is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_entries_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
-- pg_bigm を使用した日本語全文検索インデックス
CREATE INDEX idx_entries_content_search_gin ON entries USING gin (content gin_bigm_ops);
CREATE INDEX idx_entries_active_lookup ON entries(account_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_entries_updated_at BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- TAGS: タグ定義
CREATE TABLE tags (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    name       TEXT NOT NULL,
    color_code TEXT NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT uq_account_tag_name UNIQUE (account_id, name)
);

-- ENTRY_TAGS: 多対多リレーション
CREATE TABLE entry_tags (
    entry_id BIGINT NOT NULL,
    tag_id   BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_entry_tags PRIMARY KEY (entry_id, tag_id),
    CONSTRAINT fk_et_entry FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_et_tag   FOREIGN KEY (tag_id)   REFERENCES tags(id)   ON DELETE CASCADE
);
CREATE INDEX idx_entry_tags_tag_id ON entry_tags(tag_id);

-- AUDIT_LOGS: 管理操作ログ
CREATE TABLE audit_logs (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id          UUID NOT NULL,
    target_account_id UUID NOT NULL,
    action            TEXT NOT NULL,
    details           JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_admin  FOREIGN KEY (admin_id) REFERENCES accounts(id),
    CONSTRAINT fk_audit_target FOREIGN KEY (target_account_id) REFERENCES accounts(id)
);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_account_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_isolation_policy ON accounts
    USING (id = NULLIF(current_setting('app.current_account_id', true), '')::UUID OR is_admin = true);

CREATE POLICY entry_isolation_policy ON entries
    USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::UUID);

CREATE POLICY tag_isolation_policy ON tags
    USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::UUID);

CREATE POLICY entry_tags_isolation_policy ON entry_tags
    USING (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_tags.entry_id
              AND entries.account_id = NULLIF(current_setting('app.current_account_id', true), '')::UUID
        )
    );
