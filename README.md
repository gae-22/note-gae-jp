<div align="center">

# ◆ note.gae

**A beautifully crafted personal note-taking app with real-time Markdown rendering.**

[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=000)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=fff)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=fff)](https://hono.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-Private-333)](#)

</div>

---

## ✨ Features

| Feature                | Description                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Split Editor**       | CodeMirror 6 editor with real-time Markdown preview (split / editor / preview modes)   |
| **Void Kinetic Theme** | Dark-first design with lime accent (`#c8ff00`), fluid typography, and micro-animations |
| **3-Tier Auth**        | Admin (session), Share (URL token), Public — with Argon2id password hashing            |
| **Share Links**        | Time-limited share tokens with copy/revoke management                                  |
| **Tag System**         | Color-coded tags with AND-filter, inline creation, and note count aggregation          |
| **Auto-Save**          | 1-second debounce auto-save + instant `⌘S`                                             |
| **Keyboard Shortcuts** | `⌘K` search, `⌘B` sidebar, `⌘N` new note, `⌘1/2/3` view modes                          |
| **Theme Toggle**       | Dark ↔ Light mode with smooth CSS variable transitions                                 |
| **Markdown Pipeline**  | GFM, syntax highlighting, sanitization via unified/remark/rehype                       |
| **Code Splitting**     | Optimized chunks: vendor (44KB), app (70KB), markdown (104KB), editor (174KB) gzip     |

---

## 🏗️ Architecture

```
note-gae-jp/
├── packages/
│   ├── shared/          # Types + Zod schemas
│   ├── backend/         # Hono API + Drizzle ORM (bun:sqlite)
│   └── frontend/        # Vite + React 19 + Tailwind CSS v4
├── docs/                # Design specs (5 documents)
├── .prettierrc          # Prettier + Tailwind class sorting
└── package.json         # Bun workspaces
```

### Tech Stack

| Layer          | Technology                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**    | [Bun](https://bun.sh) — unified runtime, package manager, test runner                                                        |
| **Backend**    | [Hono](https://hono.dev) + [Drizzle ORM](https://orm.drizzle.team) + bun:sqlite                                              |
| **Frontend**   | [React 19](https://react.dev) + [Vite](https://vite.dev) + [Tailwind CSS v4](https://tailwindcss.com)                        |
| **Editor**     | [CodeMirror 6](https://codemirror.net) with custom Void Kinetic theme                                                        |
| **Markdown**   | [unified](https://unifiedjs.com) (remark-gfm → rehype-sanitize → rehype-highlight)                                           |
| **Routing**    | [TanStack Router](https://tanstack.com/router)                                                                               |
| **Data**       | [TanStack Query](https://tanstack.com/query)                                                                                 |
| **Validation** | [Zod](https://zod.dev) (shared schemas for API contracts)                                                                    |
| **Formatting** | [Prettier](https://prettier.io) + [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) |

### Database Schema

```
admins ← sessions
notes ← note_tags → tags
notes ← share_tokens
notes ← comments
```

7 tables: `admins`, `sessions`, `notes`, `tags`, `note_tags`, `share_tokens`, `comments`

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0

### Setup

```bash
# Clone
git clone <repo-url> note-gae-jp
cd note-gae-jp

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
bun run db:migrate
bun run db:seed
```

### Development

```bash
# Start both backend + frontend
bun run dev

# Or start individually
bun run dev:backend    # → http://localhost:3000
bun run dev:frontend   # → http://localhost:5173
```

### Build

```bash
bun run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action         |
| -------- | -------------- |
| `⌘ + S`  | Save note      |
| `⌘ + K`  | Focus search   |
| `⌘ + B`  | Toggle sidebar |
| `⌘ + N`  | New note       |
| `⌘ + 1`  | Editor mode    |
| `⌘ + 2`  | Preview mode   |
| `⌘ + 3`  | Split mode     |

---

## 📁 Available Scripts

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `bun run dev`          | Start all dev servers          |
| `bun run dev:backend`  | Start backend only             |
| `bun run dev:frontend` | Start frontend only            |
| `bun run build`        | Production build               |
| `bun run db:generate`  | Generate Drizzle migrations    |
| `bun run db:migrate`   | Run database migrations        |
| `bun run db:seed`      | Seed admin user                |
| `bun run format`       | Format all files with Prettier |
| `bun run format:check` | Check formatting               |

---

## 🔐 Authentication

| Role       | Method                                   | Access              |
| ---------- | ---------------------------------------- | ------------------- |
| **Admin**  | Session cookie (HTTP-only, 7-day expiry) | Full CRUD           |
| **Share**  | URL token (`/s/:token`)                  | Read note + comment |
| **Public** | No auth required                         | View public notes   |

Passwords are hashed with **Argon2id** via `Bun.password`.

---

## 📄 API Endpoints

| Method            | Path                    | Auth        | Description                           |
| ----------------- | ----------------------- | ----------- | ------------------------------------- |
| `POST`            | `/api/auth/login`       | —           | Login                                 |
| `POST`            | `/api/auth/logout`      | Admin       | Logout                                |
| `GET`             | `/api/auth/me`          | Admin       | Current user                          |
| `GET`             | `/api/notes`            | Admin       | List notes (search, filter, paginate) |
| `POST`            | `/api/notes`            | Admin       | Create note                           |
| `GET`             | `/api/notes/:id`        | Admin/Share | Get note                              |
| `PATCH`           | `/api/notes/:id`        | Admin       | Update note                           |
| `DELETE`          | `/api/notes/:id`        | Admin       | Delete note                           |
| `GET/POST/DELETE` | `/api/tags/*`           | Admin       | Tag CRUD                              |
| `GET/POST/DELETE` | `/api/tokens/*`         | Admin       | Share token management                |
| `GET/POST/DELETE` | `/api/comments/*`       | Admin/Share | Comments                              |
| `GET`             | `/api/public/notes`     | —           | Public notes list                     |
| `GET`             | `/api/public/notes/:id` | —           | Public note detail                    |

---

## 🎨 Design System — Void Kinetic

| Token        | Value                       |
| ------------ | --------------------------- |
| Background   | `#050505` → `#0a0a0a`       |
| Accent       | `#c8ff00` (Lime)            |
| Heading Font | Outfit                      |
| Body Font    | Inter + Zen Kaku Gothic New |
| Mono Font    | JetBrains Mono              |
| Typography   | Fluid `clamp()` scale       |

---

<div align="center">

**Built with ◆ by gae**

</div>
