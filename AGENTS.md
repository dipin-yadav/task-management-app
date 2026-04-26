# AGENTS.md — AI Agent Guide for Task Management App

> **Purpose:** This document provides all the context an AI coding agent needs to understand, navigate, modify, and extend this project safely and correctly.

---

## 1. Project Overview

This is a **full-stack task management and collaboration application** built with the [T3 Stack](https://create.t3.gg/) (scaffolded with `npm create t3-app@7.37.0`). It allows teams to create projects, assign tasks, set priorities/deadlines/tags, and manage team members.

### Core Stack

| Layer           | Technology                     | Version / Notes                               |
|-----------------|--------------------------------|-----------------------------------------------|
| Framework       | **Next.js** (Pages Router)     | v14 — **NOT App Router**                      |
| Language        | **TypeScript**                 | Strict mode (`noUncheckedIndexedAccess: true`) |
| Styling         | **Tailwind CSS**               | v3, PostCSS via `postcss.config.cjs`          |
| API Layer       | **tRPC**                       | v11 — end-to-end typesafe RPC                 |
| Auth            | **NextAuth.js**                | v4 — Credentials provider (email + password)  |
| ORM             | **Prisma**                     | v5 — PostgreSQL provider                      |
| Database        | **PostgreSQL**                 | Local Docker or Supabase in production        |
| Deployment      | **SST** (Serverless Stack)     | Deploys to AWS (Lambda + CloudFront + S3)     |
| Package Manager | **npm**                        | Exact versions pinned (`.npmrc: save-exact=true`) |

---

## 2. Project Structure

```
task-management-app/
├── AGENTS.md                    # ← YOU ARE HERE — AI agent guide
├── docs/                        # Project documentation
│   ├── architecture.md          # System architecture, diagrams, design decisions
│   ├── plan.md                  # Implementation plan (7 phases)
│   ├── todo.md                  # Phase-by-phase task checklist
│   ├── database-schema.md       # Prisma schema documentation
│   ├── api-reference.md         # tRPC endpoint reference
│   ├── setup-guide.md           # Environment and deployment setup
│   └── test_cases.md            # Test case specifications
│
├── prisma/
│   ├── schema.prisma            # ★ DATABASE SCHEMA — single source of truth
│   └── migrations/              # Prisma migration history
│       └── 20260425162350_init/ # Initial migration
│
├── src/
│   ├── env.js                   # Zod-validated environment variables
│   ├── pages/                   # Next.js Pages Router
│   │   ├── _app.tsx             # App wrapper (SessionProvider + tRPC + Geist font)
│   │   ├── index.tsx            # Landing page / authenticated home
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth].ts  # NextAuth catch-all handler
│   │   │   │   └── signup.ts         # Custom signup REST endpoint
│   │   │   └── trpc/
│   │   │       └── [trpc].ts         # tRPC HTTP handler
│   │   └── auth/
│   │       ├── signin.tsx       # Login page
│   │       └── signup.tsx       # Registration page
│   │
│   ├── server/                  # Server-side only code
│   │   ├── auth.ts              # NextAuth config (Credentials + JWT + Prisma Adapter)
│   │   ├── db.ts                # Prisma client singleton
│   │   └── api/
│   │       ├── root.ts          # ★ ROOT ROUTER — merges all sub-routers
│   │       ├── trpc.ts          # tRPC init, context, middleware, procedure builders
│   │       └── routers/
│   │           ├── auth.ts      # getProfile, updateProfile
│   │           ├── project.ts   # CRUD + member management + verifyProjectMembership()
│   │           ├── task.ts      # CRUD + assign + updateStatus + filters
│   │           └── tag.ts       # CRUD + addToTask + removeFromTask
│   │
│   ├── styles/
│   │   └── globals.css          # Tailwind directives
│   │
│   └── utils/
│       └── api.ts               # tRPC client setup + type inference helpers
│
├── public/                      # Static assets
│   └── favicon.ico
│
├── start-database.sh            # Docker-based local PostgreSQL setup
├── package.json                 # Dependencies (all pinned to exact versions)
├── tsconfig.json                # TypeScript config (strict, path alias ~/*)
├── tailwind.config.ts           # Tailwind config (Geist Sans font)
├── postcss.config.cjs           # PostCSS config
├── .eslintrc.cjs                # ESLint config (typescript-eslint recommended)
├── prettier.config.js           # Prettier config (tailwindcss plugin)
├── next.config.js               # Next.js config (i18n, geist transpile)
├── .env.example                 # Environment variable template
├── .npmrc                       # npm config: save-exact=true
└── task.txt                     # Original task requirements
```

---

## 3. Key Architectural Decisions

### 3.1 Pages Router (NOT App Router)
This project uses **Next.js Pages Router** — not the App Router. All pages go in `src/pages/`. Do NOT create files in `src/app/`.

### 3.2 Path Alias
The project uses `~/*` as a path alias mapping to `./src/*`:
```typescript
import { api } from "~/utils/api";
import { db } from "~/server/db";
```

### 3.3 Authentication Architecture
- **Provider:** NextAuth.js v4 with `CredentialsProvider` (email + password)
- **Session Strategy:** `jwt` (NOT database sessions — Credentials provider limitation)
- **Adapter:** `PrismaAdapter` (manages User/Account/Session tables)
- **Password Hashing:** `bcryptjs`
- **Signup:** Custom REST endpoint at `POST /api/auth/signup` (NextAuth has no built-in signup)
- **Session Callbacks:** JWT and session callbacks inject `user.id` into the session

### 3.4 tRPC Procedure Types
Defined in `src/server/api/trpc.ts`:

| Procedure           | Auth Required | Description                                         |
|---------------------|---------------|-----------------------------------------------------|
| `publicProcedure`   | No            | Accessible without authentication                   |
| `protectedProcedure`| Yes           | Requires valid session; `ctx.session.user` guaranteed|

Both include `timingMiddleware` which logs execution time and adds artificial delay in dev mode.

### 3.5 Authorization Pattern
Authorization is **not middleware-based** but handled per-procedure using the shared `verifyProjectMembership()` helper exported from `src/server/api/routers/project.ts`:

```typescript
// Verify user is a project member
await verifyProjectMembership(ctx.db, projectId, ctx.session.user.id);

// Verify user has specific role(s)
await verifyProjectMembership(ctx.db, projectId, ctx.session.user.id, ["OWNER", "ADMIN"]);
```

This function throws `TRPCError` with code `FORBIDDEN` if the check fails.

### 3.6 Database Connection
- **Local dev:** Docker PostgreSQL via `start-database.sh` (port 5432)
- **Production:** Supabase PostgreSQL
  - `DATABASE_URL` → pooled connection (port 6543) for app runtime
  - `DIRECT_URL` → direct connection (port 5432) for Prisma migrations

### 3.7 Environment Validation
All environment variables are validated at startup via `@t3-oss/env-nextjs` in `src/env.js`. When adding new env vars:
1. Add the Zod schema to `server:` or `client:` in `src/env.js`
2. Add the runtime mapping in `runtimeEnv:`
3. Add the variable to `.env.example`

Skip validation during Docker builds with `SKIP_ENV_VALIDATION=true`.

---

## 4. Development Setup

### Prerequisites
- Node.js ≥ 18.x
- npm ≥ 9.x
- Docker (for local PostgreSQL)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Start local PostgreSQL (Docker)
./start-database.sh

# 4. Run database migrations
npx prisma migrate dev

# 5. Generate Prisma Client
npx prisma generate

# 6. Start dev server
npm run dev
```

### Available Scripts

| Command                | Description                                      |
|------------------------|--------------------------------------------------|
| `npm run dev`          | Start Next.js dev server (port 3000)             |
| `npm run build`        | Production build                                 |
| `npm run start`        | Start production server                          |
| `npm run lint`         | Run ESLint                                       |
| `npm run db:generate`  | Run `prisma migrate dev`                         |
| `npm run db:migrate`   | Run `prisma migrate deploy`                      |
| `npm run db:push`      | Push schema without migration                    |
| `npm run db:studio`    | Open Prisma Studio (database GUI)                |

---

## 5. Database Schema Summary

The schema is defined in `prisma/schema.prisma`. Key models:

| Model             | Purpose                                                    |
|-------------------|------------------------------------------------------------|
| `User`            | User accounts (extends NextAuth schema with `password`)    |
| `Account`         | NextAuth OAuth accounts (standard)                         |
| `Session`         | NextAuth sessions (standard)                               |
| `VerificationToken`| NextAuth email verification (standard)                    |
| `Project`         | Top-level container for tasks; has an owner                |
| `ProjectMember`   | Join table: User ↔ Project with `role` (OWNER/ADMIN/MEMBER)|
| `Task`            | Task within a project; has status, priority, assignee      |
| `Tag`             | Project-scoped label with color                            |
| `TaskTag`         | Many-to-many join: Task ↔ Tag                              |

### Enums
- **`ProjectRole`**: `OWNER`, `ADMIN`, `MEMBER`
- **`TaskStatus`**: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`
- **`TaskPriority`**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### Important Schema Constraints
- `User.email` is unique
- `ProjectMember` has `@@unique([projectId, userId])` — one membership per user per project
- `Tag` has `@@unique([name, projectId])` — tag names unique within a project
- `TaskTag` uses composite PK `@@id([taskId, tagId])`
- All IDs use `cuid()` generation
- Cascade deletes: deleting a Project removes its members, tasks, tags, and task-tag associations

---

## 6. tRPC Router Reference

All routers are merged in `src/server/api/root.ts`:

```typescript
export const appRouter = createTRPCRouter({
  project: projectRouter,  // src/server/api/routers/project.ts
  task: taskRouter,         // src/server/api/routers/task.ts
  tag: tagRouter,           // src/server/api/routers/tag.ts
  auth: authRouter,         // src/server/api/routers/auth.ts
});
```

### Auth Router (`auth`)
- `auth.getProfile` — query, protected — returns current user (excludes password)
- `auth.updateProfile` — mutation, protected — update name/image

### Project Router (`project`)
- `project.create` — auto-adds caller as OWNER
- `project.list` — returns all projects user is member of
- `project.getById` — includes members + task counts by status
- `project.update` — requires OWNER or ADMIN
- `project.delete` — requires OWNER
- `project.addMember` — by email, requires OWNER/ADMIN
- `project.removeMember` — cannot remove OWNER
- `project.updateMemberRole` — OWNER only, cannot change own role

### Task Router (`task`)
- `task.create` — validates project membership + assignee membership
- `task.list` — filterable by status, priority, assignee, tags, search text
- `task.getById` — includes tags, assignee, creator, project info
- `task.update` — uses transaction for tag replacement
- `task.delete` — membership check
- `task.assign` — assign/reassign or unassign (null)
- `task.updateStatus` — quick status change for drag-and-drop

### Tag Router (`tag`)
- `tag.create` — enforces unique name per project
- `tag.list` — includes task count
- `tag.update` — enforces unique name on rename
- `tag.delete` — cascade removes task associations
- `tag.addToTask` — validates tag belongs to same project as task
- `tag.removeFromTask` — validates association exists

---

## 7. Coding Conventions

### TypeScript
- **Strict mode** is enabled with `noUncheckedIndexedAccess: true`
- Use **type imports**: `import { type Foo } from "bar"` (enforced by ESLint)
- Unused variables with `_` prefix are allowed
- Target: `ES2022`
- Module: `ESNext` with `Bundler` resolution

### ESLint Rules
- Based on `@typescript-eslint/recommended-type-checked` and `stylistic-type-checked`
- `@typescript-eslint/consistent-type-imports` — prefer inline type imports
- `@typescript-eslint/no-misused-promises` — error (void return attributes exempted)
- `@typescript-eslint/require-await` — disabled
- `@typescript-eslint/array-type` — disabled
- `@typescript-eslint/consistent-type-definitions` — disabled

### Prettier
- Uses `prettier-plugin-tailwindcss` for automatic class sorting
- Default Prettier settings (no custom overrides beyond the plugin)

### Dependency Management
- **All versions are pinned exactly** (no `^` or `~`) via `.npmrc: save-exact=true`
- Always use exact versions when adding dependencies: `npm install package@1.2.3`

### Error Handling in tRPC
Use `TRPCError` with appropriate codes:
- `UNAUTHORIZED` — no valid session
- `FORBIDDEN` — insufficient permissions
- `NOT_FOUND` — resource doesn't exist
- `BAD_REQUEST` — invalid input
- `CONFLICT` — duplicate entry

### Input Validation
All tRPC inputs are validated with **Zod** schemas inline. Common patterns:
- `z.string().cuid()` for IDs
- `z.string().min(1).max(N)` for names/titles
- `z.nativeEnum(PrismaEnum)` for Prisma enums
- `z.string().regex(/^#[0-9a-fA-F]{6}$/)` for hex colors

---

## 8. How to Add New Features

### Adding a New tRPC Router

1. Create the router file in `src/server/api/routers/<name>.ts`
2. Import `createTRPCRouter` and `protectedProcedure` (or `publicProcedure`) from `~/server/api/trpc`
3. Define procedures with Zod input validation
4. Use `verifyProjectMembership()` from `./project` if the feature is project-scoped
5. Register the router in `src/server/api/root.ts`:
   ```typescript
   import { newRouter } from "~/server/api/routers/<name>";
   export const appRouter = createTRPCRouter({
     // ...existing routers
     newFeature: newRouter,
   });
   ```

### Adding a New Page

1. Create the page in `src/pages/<path>.tsx` (Pages Router convention)
2. Use `useSession()` from `next-auth/react` for client-side auth checks
3. Use `api.<router>.<procedure>.useQuery()` or `.useMutation()` for data fetching
4. For protected pages, add server-side redirect in `getServerSideProps`:
   ```typescript
   import { getServerAuthSession } from "~/server/auth";
   export const getServerSideProps = async (ctx) => {
     const session = await getServerAuthSession(ctx);
     if (!session) {
       return { redirect: { destination: "/auth/signin", permanent: false } };
     }
     return { props: { session } };
   };
   ```

### Modifying the Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Update `docs/database-schema.md` to reflect changes
4. Update relevant tRPC routers if new fields/models are added
5. Update `docs/api-reference.md` if API contracts change

### Adding Environment Variables

1. Add the Zod validation in `src/env.js` under `server:` or `client:`
2. Add the runtime reference in `runtimeEnv:` in `src/env.js`
3. Add to `.env` and `.env.example`
4. Client-side vars must be prefixed with `NEXT_PUBLIC_`

---

## 9. Project Status & Remaining Work

The project is being built in **7 phases** (see `docs/plan.md` and `docs/todo.md`):

| Phase | Description                  | Status      |
|-------|------------------------------|-------------|
| 1     | Project Setup & Foundation   | ✅ Complete |
| 2     | Authentication               | ✅ Complete |
| 3     | Core Features (tRPC Routers) | ✅ Complete |
| 4     | UI/UX Implementation         | 🔲 Not started |
| 5     | Testing                      | 🔲 Not started |
| 6     | Deployment (SST + AWS)       | 🔲 Not started |
| 7     | Documentation & Polish       | 🔲 Not started |

### What's Built
- Full Prisma schema with all models and relations
- NextAuth with Credentials provider (email/password)
- Custom signup API route (`/api/auth/signup`)
- Signin and signup pages
- All 4 tRPC routers (project, task, tag, auth) with full CRUD
- Authorization system via `verifyProjectMembership()`
- Landing page with auth-aware UI

### What's NOT Built Yet
- UI components (layout, sidebar, task board, forms, etc.)
- Project pages (`/projects`, `/projects/[id]`, etc.)
- Task detail pages
- Profile page
- Dashboard (optional)
- Unit tests
- SST deployment configuration
- Comprehensive README

---

## 10. Documentation Reference

The `docs/` folder contains detailed documentation:

| File                  | Contents                                            |
|-----------------------|-----------------------------------------------------|
| `architecture.md`     | System diagrams, tech stack, ERD, auth flow, infra   |
| `plan.md`             | 7-phase implementation plan with detailed tasks      |
| `todo.md`             | Granular task checklist (checkbox format)             |
| `database-schema.md`  | Full Prisma schema with annotations and commands     |
| `api-reference.md`    | All tRPC procedures with inputs/outputs/auth rules   |
| `setup-guide.md`      | Environment setup, Supabase, AWS, local dev workflow |
| `test_cases.md`       | Test case specifications for all features            |

**Always consult these docs before making changes** to understand design intent and constraints.

---

## 11. Common Gotchas

1. **Never use App Router patterns** — This project uses Pages Router. No `src/app/` directory, no `page.tsx`, no server components, no `use client` directives.

2. **Credentials provider + JWT** — Database sessions don't work with NextAuth's Credentials provider. Always use `strategy: "jwt"`.

3. **Prisma bypasses Supabase RLS** — All authorization must be handled in tRPC middleware/procedures, not at the database level.

4. **Signup is a REST route, not tRPC** — Signup happens at `POST /api/auth/signup` because the user isn't authenticated yet and tRPC's `publicProcedure` is reserved for read operations in this project.

5. **`verifyProjectMembership()` is imported from `project.ts`** — Other routers (task, tag) import this helper. If you refactor, don't break this cross-router dependency.

6. **Exact dependency versions** — All deps are pinned. When adding new packages, they'll automatically be saved with exact versions due to `.npmrc`.

7. **Environment validation** — The app will crash on startup if required env vars are missing or invalid. Add new vars to `src/env.js` first.

8. **Supabase connection pooling** — In production, use the pooled URL (port 6543) for `DATABASE_URL` and direct URL (port 5432) for `DIRECT_URL`. Never run migrations through the pooler.

9. **Prisma Client generation** — The `postinstall` script runs `prisma generate` automatically after `npm install`. If you see type errors after schema changes, run `npx prisma generate` manually.

10. **`superjson` transformer** — tRPC uses `superjson` for serialization (handles `Date`, `Map`, `Set`, etc.). It's configured in both the client (`src/utils/api.ts`) and server (`src/server/api/trpc.ts`).
