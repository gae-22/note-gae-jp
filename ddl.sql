-- ==============================================================================
-- 1. EXTENSIONS & SETTINGS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_bigm";

-- ステータス ENUM 型
CREATE TYPE entry_status_type AS ENUM ('draft', 'published', 'archived');

-- ==============================================================================
-- 2. UTILITIES
-- ==============================================================================
-- updated_at 自動更新トリガー
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
COMMENT ON TABLE accounts IS 'ユーザーアカウント情報';
COMMENT ON COLUMN accounts.email IS 'メールアドレス（ユニーク）';

CREATE TRIGGER trg_accounts_updated_at 
BEFORE UPDATE ON accounts 
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ENTRIES: 日記エントリー
CREATE TABLE entries (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    status     entry_status_type NOT NULL DEFAULT 'draft',
    is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_entries_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
COMMENT ON TABLE entries IS 'ユーザーの日記エントリー';
COMMENT ON COLUMN entries.status IS 'draft/published/archived';

-- 日本語全文検索インデックス
CREATE INDEX idx_entries_content_bigm 
    ON entries USING gin (content gin_bigm_ops);

-- アクティブなエントリーの高速取得
CREATE INDEX idx_entries_active 
    ON entries(account_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_entries_updated_at 
BEFORE UPDATE ON entries 
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- TAGS: タグ定義
CREATE TABLE tags (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    name       TEXT NOT NULL,
    color_code TEXT NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT uq_account_tag_name UNIQUE (account_id, name)
);
COMMENT ON TABLE tags IS 'ユーザーごとのタグ定義';

-- 大文字小文字を無視した検索用
CREATE INDEX idx_tags_name_lower ON tags (LOWER(name));


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
    admin_id          UUID,
    target_account_id UUID NOT NULL,
    action            TEXT NOT NULL,
    details           JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_admin  
        FOREIGN KEY (admin_id) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_target 
        FOREIGN KEY (target_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_account_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

-- ACCOUNTS: 自分自身 or 管理者のみ
CREATE POLICY account_isolation_policy ON accounts
    USING (
        id = current_setting('app.current_account_id', true)::UUID
        OR is_admin = true
    )
    WITH CHECK (
        id = current_setting('app.current_account_id', true)::UUID
        OR is_admin = true
    );

-- ENTRIES: 自分のエントリーのみ
CREATE POLICY entry_isolation_policy ON entries
    USING (account_id = current_setting('app.current_account_id', true)::UUID)
    WITH CHECK (account_id = current_setting('app.current_account_id', true)::UUID);

-- TAGS: 自分のタグのみ
CREATE POLICY tag_isolation_policy ON tags
    USING (account_id = current_setting('app.current_account_id', true)::UUID)
    WITH CHECK (account_id = current_setting('app.current_account_id', true)::UUID);

-- ENTRY_TAGS: 自分の entries に紐づくもののみ
CREATE POLICY entry_tags_isolation_policy ON entry_tags
    USING (
        EXISTS (
            SELECT 1 FROM entries 
            WHERE entries.id = entry_tags.entry_id
              AND entries.account_id = current_setting('app.current_account_id', true)::UUID
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM entries 
            WHERE entries.id = entry_tags.entry_id
              AND entries.account_id = current_setting('app.current_account_id', true)::UUID
        )
    );
