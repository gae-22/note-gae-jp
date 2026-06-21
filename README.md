# 個人用メモ・日記アプリ 完全版 要件定義・設計・実装ドキュメント

## 1. プロジェクト概要

日常の気付きや技術的な学びを記録するための個人用メモ・日記Webアプリケーション

## 2. 技術スタック

* フロントエンド
    * フレームワーク: Next.js 15+ (TypeScript / App Router)
    * UI / 状態管理: MUI (Material-UI) / React Hooks
    * アイコン: `@mui/icons-material` (Outlined系)
    * テスト: Vitest + React Testing Library
    * API通信: Next.js Rewrites（プロキシによるCORS回避）+ Axios
    * 品質管理: pnpm / ESLint / Prettier


* バックエンド
    * フレームワーク: FastAPI (Python 3.14)
    * ORM / DB: SQLAlchemy 2.0 / PostgreSQL 18
    * 環境変数管理: pydantic-settings（自動型変換・フェイルセーフ対応）
    * テスト: pytest + httpx
    * 品質管理: uv / Ruff / ty


* インフラ
    * コンテナ: Docker / Docker Compose (開発・本番オーバーライド構成)



---

## 3. UI/UX デザイン設計

コンセプト：「Digital Zen（デジタルな静寂） / Mathematical Harmony & Micro-details」

黄金比に基づいた完璧なプロポーションと、触れた瞬間の滑らかなアニメーションで上質な操作感を演出する。
MUIの野暮ったさを完全に排除し、極薄のシャドウと繊細な境界線で構成する。

### 3-1. MUI テーマ設定 (`frontend/src/lib/theme.ts`)

```typescript
'use client';
import { createTheme } from '@mui/material/styles';

const GOLDEN_RATIO = 1.618;
const EASE_OUT_SMOOTH = 'cubic-bezier(0.25, 1, 0.5, 1)';

export const theme = createTheme({
  palette: {
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    primary: { main: '#111111', light: '#333333' },
    text: { primary: '#1A1A1A', secondary: '#737373' },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", sans-serif',
    h1: { fontSize: `${1 * Math.pow(GOLDEN_RATIO, 3)}rem`, fontWeight: 700, letterSpacing: '-0.04em' },
    h2: { fontSize: `${1 * Math.pow(GOLDEN_RATIO, 2)}rem`, fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontSize: `${1 * GOLDEN_RATIO}rem`, fontWeight: 600, letterSpacing: '-0.02em' },
    body1: { fontSize: '1rem', lineHeight: 1.7, color: '#1A1A1A' },
    body2: { fontSize: '0.875rem', lineHeight: 1.6, color: '#737373' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          padding: '10px 24px',
          transition: `all 0.4s ${EASE_OUT_SMOOTH}`,
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
          '&:active': { transform: 'scale(0.97)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 32px rgba(0, 0, 0, 0.04)',
          transition: `all 0.5s ${EASE_OUT_SMOOTH}`,
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04), 0 12px 48px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: `all 0.3s ${EASE_OUT_SMOOTH}`,
            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
            '&.Mui-focused fieldset': {
              borderColor: '#111111', borderWidth: '1px', boxShadow: '0 0 0 3px rgba(17, 17, 17, 0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6, fontWeight: 500, backgroundColor: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.04)',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
        },
      },
    },
  },
});

```

---

## 4. データベース設計（PostgreSQL 18 DDL）

第3正規形、サロゲートキー、論理削除、自動タイムスタンプ更新を備えた堅牢なテーブル定義。

```sql
DROP TABLE IF EXISTS entry_tag CASCADE;
DROP TABLE IF EXISTS tag CASCADE;
DROP TABLE IF EXISTS entry CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL DEFAULT '名無しユーザー',
    avatar_url VARCHAR(255),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_account_modtime BEFORE UPDATE ON account FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE entry (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_entry_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);
CREATE INDEX idx_entry_account_id ON entry(account_id);
CREATE INDEX idx_entry_deleted_at ON entry(deleted_at);
CREATE TRIGGER update_entry_modtime BEFORE UPDATE ON entry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE tag (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tag_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT uq_account_tag_name UNIQUE (account_id, name)
);
CREATE INDEX idx_tag_account_id ON tag(account_id);

CREATE TABLE entry_tag (
    entry_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entry_id, tag_id),
    CONSTRAINT fk_entry_tag_entry FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

```

---

## 5. インフラ・コンテナ設計

### 5-1. セキュリティ・環境変数・CORS回避プロキシ設計

APIキーやDBパスワードはコードに含めず、`.env` ファイルと `pydantic-settings` を用いて型安全に管理。APIのURLもプロキシ機能で隠蔽する。

**環境変数 (`.env.dev` ※Git管理外)**

```env
DB_USER=postgres
DB_PASSWORD=password_dev
DB_NAME=diary_app
SECRET_KEY=your-super-secret-jwt-key-2026

```

**フロントエンド プロキシ設定 (`frontend/next.config.mjs`)**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://backend:8000/api/:path*' },
    ];
  },
};
export default nextConfig;

```

### 5-2. Docker Compose構成 (`docker-compose.yml`)

```yaml
version: '3.8'
services:
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - SECRET_KEY=${SECRET_KEY}
    depends_on: [db]
  frontend:
    build: ./frontend
    depends_on: [backend]
volumes:
  postgres_data:

```

---

## 6. バックエンド詳細設計（ファイル・関数ブループリント）

FastAPI (Python 3.14) を用いたレイヤードアーキテクチャ。`typing` を用いた厳密な型定義と `pydantic` のバリデーションで構成する。

```text
backend/app/
├── main.py
│   └── app: FastAPI = FastAPI(title="Diary API", version="1.0.0")
│
├── core/
│   ├── config.py
│   │   └── class Settings(BaseSettings):
│   ├── security.py
│   │   ├── def get_password_hash(password: str) -> str:
│   │   ├── def verify_password(plain_password: str, hashed_password: str) -> bool:
│   │   └── def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
│   └── exceptions.py
│       ├── class APIException(HTTPException):
│       ├── class NotFoundException(APIException):
│       └── def setup_exception_handlers(app: FastAPI) -> None:
│
├── db/
│   └── database.py
│       ├── engine: Engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
│       ├── SessionLocal: sessionmaker[Session] = sessionmaker(autocommit=False, autoflush=False, bind=engine)
│       └── class Base(DeclarativeBase):
│
├── models/
│   ├── account.py    (class Account(Base):)
│   ├── entry.py      (class Entry(Base):)
│   ├── tag.py        (class Tag(Base):)
│   └── entry_tag.py  (class EntryTag(Base):)
│
├── schemas/
│   ├── account.py    (class AccountCreate(BaseModel):, class AccountResponse(BaseModel):)
│   ├── entry.py      (class EntryStatus(str, Enum):, class EntryCreate(BaseModel):, class EntryResponse(BaseModel):)
│   ├── tag.py        (class TagCreate(BaseModel):, class TagResponse(BaseModel):)
│   └── token.py      (class Token(BaseModel):, class TokenPayload(BaseModel):)
│
├── crud/
│   ├── crud_account.py
│   │   ├── def get_by_email(db: Session, email: str) -> Optional[Account]:
│   │   └── def create(db: Session, obj_in: AccountCreate) -> Account:
│   ├── crud_entry.py
│   │   ├── def get_multi(db: Session, account_id: UUID, skip: int = 0, limit: int = 100, status: Optional[EntryStatus] = None) -> List[Entry]:
│   │   ├── def create(db: Session, obj_in: EntryCreate, account_id: UUID) -> Entry:
│   │   ├── def update(db: Session, db_obj: Entry, obj_in: EntryUpdate) -> Entry:
│   │   └── def soft_delete(db: Session, db_obj: Entry) -> Entry:
│   └── crud_tag.py
│       ├── def get_multi(db: Session, account_id: UUID) -> List[Tag]:
│       └── def create(db: Session, obj_in: TagCreate, account_id: UUID) -> Tag:
│
└── api/
    ├── dependencies.py
    │   ├── def get_db() -> Generator[Session, None, None]:
    │   └── def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> Account:
    └── v1/
        ├── auth.py
        │   ├── @router.post("/register") def register(obj_in: AccountCreate, db: Session = Depends(get_db)) -> Account:
        │   └── @router.post("/token") def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Dict[str, str]:
        ├── entries.py
        │   ├── @router.get("/") def read_entries(status: Optional[EntryStatus] = None, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> List[Entry]:
        │   ├── @router.post("/") def create_new_entry(obj_in: EntryCreate, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> Entry:
        │   ├── @router.get("/{id}") def read_entry(id: int, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> Entry:
        │   ├── @router.put("/{id}") def update_existing_entry(id: int, obj_in: EntryUpdate, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> Entry:
        │   └── @router.delete("/{id}") def delete_existing_entry(id: int, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> None:
        └── tags.py
            ├── @router.get("/") def read_tags(db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> List[Tag]:
            └── @router.post("/") def create_new_tag(obj_in: TagCreate, db: Session = Depends(get_db), current_user: Account = Depends(get_current_user)) -> Tag:

```

---

## 7. フロントエンド詳細設計（ファイル・関数ブループリント）

Next.js 15+ (App Router) と TypeScript を使用。React Server ComponentsとClient Components（HooksやMUIを含む）を明確に分離した設計。

```text
frontend/src/
├── app/
│   ├── layout.tsx
│   │   └── export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element
│   ├── error.tsx
│   │   └── export default function GlobalError({ error, reset }: { error: Error; reset: () => void }): React.JSX.Element
│   ├── page.tsx
│   │   └── export default function HomePage(): null
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   │   └── export default function LoginPage(): React.JSX.Element
│   │   └── register/page.tsx
│   │       └── export default function RegisterPage(): React.JSX.Element
│   └── dashboard/
│       ├── layout.tsx
│       │   └── export default function DashboardLayout({ children }: { children: React.ReactNode }): React.JSX.Element
│       ├── page.tsx
│       │   └── export default function DashboardPage(): React.JSX.Element
│       └── entries/[id]/
│           └── page.tsx
│               └── export default function EntryDetailPage({ params }: { params: { id: string } }): React.JSX.Element
│
├── components/
│   ├── elements/
│   │   ├── PrimaryButton.tsx
│   │   │   └── export const PrimaryButton: React.FC<ButtonProps> = ({ children, ...props }) =>
│   │   └── FormInput.tsx
│   │       └── export const FormInput: React.FC<TextFieldProps & { errorText?: string }> = ({ errorText, ...props }) =>
│   ├── layouts/
│   │   ├── Header.tsx
│   │   │   └── export const Header: React.FC<{ user: Account | null; onLogout: () => void }> = ({ user, onLogout }) =>
│   │   └── Sidebar.tsx
│   │       └── export const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) =>
│   ├── features/
│   │   ├── entries/
│   │   │   ├── EntryCard.tsx
│   │   │   │   └── export const EntryCard: React.FC<{ entry: Entry; onClick: () => void }> = ({ entry, onClick }) =>
│   │   │   └── EntryForm.tsx
│   │   │       └── export const EntryForm: React.FC<{ initialData?: Partial<Entry>; onSubmit: (data: any) => void }> = ({ initialData, onSubmit }) =>
│   │   └── tags/
│   │       └── TagChip.tsx
│   │           └── export const TagChip: React.FC<{ tag: Tag }> = ({ tag }) =>
│   └── providers/
│       └── ToastProvider.tsx
│           └── export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
│
├── hooks/
│   ├── useAuth.ts
│   │   └── export const useAuth = (): { user: Account | null; isLoading: boolean; login: (credentials: LoginInput) => Promise<void>; register: (data: RegisterInput) => Promise<void>; logout: () => void } =>
│   ├── useEntries.ts
│   │   └── export const useEntries = (status?: EntryStatus): { entries: Entry[]; isLoading: boolean; fetchEntries: () => Promise<void>; createEntry: (data: EntryCreateInput) => Promise<void> } =>
│   └── useEntryDetail.ts
│       └── export const useEntryDetail = (id: number): { entry: Entry | null; isLoading: boolean; updateEntry: (data: EntryUpdateInput) => Promise<void>; deleteEntry: () => Promise<void> } =>
│
├── lib/
│   ├── apiClient.ts
│   │   └── export const apiClient: AxiosInstance = axios.create({ baseURL: '/api' })
│   └── theme.ts
│       └── export const theme: Theme = createTheme({ ... })
│
└── types/
    └── index.ts
        ├── export type EntryStatus = 'published' | 'draft' | 'archived';
        ├── export interface Account { id: string; email: string; display_name: string; avatar_url: string | null; }
        ├── export interface Entry { id: number; account_id: string; title: string; content: string; status: EntryStatus; is_pinned: boolean; tags: Tag[]; created_at: string; updated_at: string; }
        └── export interface Tag { id: number; name: string; color_code: string; }

```

---

## 8. 品質管理・テスト戦略

* バックエンド (`tests/`): `pytest` を用いた結合・単体テストを実施。
* フロントエンド (`__tests__/`): `Vitest` と React Testing Library による単体テストを実施。
* エラーハンドリング:** APIエラーは `axios` のインターセプターで検知し、`ToastProvider` で通知。UIのクラッシュは Next.js の `error.tsx` (Error Boundary) でキャッチし、白い画面を防ぐ。
* CI/CD・エディタ連携: `uv`, `ruff`, `ty`, `eslint`, `prettier` を用いた静的解析と自動フォーマットを導入し、保存時の自動整形を義務付ける (`.vscode/settings.json`)。