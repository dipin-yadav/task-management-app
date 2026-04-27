# AGENTS.md - AI Agent Guide for Task Management App

This document gives coding agents the project context needed to safely modify and extend the app.

## 1. Project Overview

This is a full-stack task management and collaboration application built with the T3 Stack. It uses Next.js Pages Router, TypeScript, Tailwind CSS, tRPC, NextAuth.js, Prisma, and PostgreSQL.

Users can sign up, sign in, create projects, manage project members, create tasks, assign work, set priorities/deadlines, organize tags, and move tasks through a Kanban board.

## 2. Core Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 | Pages Router only, not App Router |
| Language | TypeScript | Strict mode, `noUncheckedIndexedAccess: true` |
| Node.js | >= 20.x | 24.x (LTS) recommended |
| Styling | Tailwind CSS v3 | PostCSS via `postcss.config.cjs` |
| API Layer | tRPC v11 | End-to-end typed RPC |
| Auth | NextAuth.js v4 | Credentials provider, email/password |
| ORM | Prisma v5 | PostgreSQL provider |
| Database | PostgreSQL | Local Docker or Supabase |
| Package Manager | npm | Exact versions pinned by `.npmrc` |

## 3. Current Project Structure

```text
task-management-app/
|-- AGENTS.md
|-- README.md
|-- docs/
|   |-- architecture.md
|   |-- plan.md
|   |-- todo.md
|   |-- database-schema.md
|   |-- api-reference.md
|   |-- setup-guide.md
|   `-- test_cases.md
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
|-- src/
|   |-- env.js
|   |-- pages/
|   |   |-- _app.tsx
|   |   |-- index.tsx
|   |   |-- dashboard.tsx
|   |   |-- profile.tsx
|   |   |-- auth/
|   |   |   |-- signin.tsx
|   |   |   `-- signup.tsx
|   |   |-- projects/
|   |   |   |-- index.tsx
|   |   |   |-- new.tsx
|   |   |   `-- [id]/
|   |   |       |-- index.tsx
|   |   |       |-- settings.tsx
|   |   |       `-- tasks/
|   |   |           `-- [taskId].tsx
|   |   `-- api/
|   |       |-- auth/
|   |       |   |-- [...nextauth].ts
|   |       |   `-- signup.ts
|   |       `-- trpc/
|   |           `-- [trpc].ts
|   |-- components/
|   |   |-- layout/
|   |   |-- tags/
|   |   |-- tasks/
|   |   `-- ui/
|   |-- server/
|   |   |-- auth.ts
|   |   |-- db.ts
|   |   |-- requireAuth.ts
|   |   `-- api/
|   |       |-- root.ts
|   |       |-- trpc.ts
|   |       `-- routers/
|   |           |-- auth.ts
|   |           |-- dashboard.ts
|   |           |-- project.ts
|   |           |-- tag.ts
|   |           `-- task.ts
|   |-- styles/
|   |   `-- globals.css
|   `-- utils/
|       |-- api.ts
|       |-- cn.ts
|       `-- format.ts
|-- public/
|-- start-database.sh
|-- package.json
|-- tsconfig.json
|-- tailwind.config.ts
|-- postcss.config.cjs
|-- prettier.config.js
|-- next.config.js
|-- .env.example
`-- .npmrc
```

## 4. Key Architecture Rules

### Pages Router Only

This project uses Next.js Pages Router. Do not add `src/app/`, `page.tsx`, server components, or `use client` directives.

### Path Alias

Use `~/*` for imports from `src/*`.

```ts
import { api } from "~/utils/api";
import { db } from "~/server/db";
```

### Authentication

- NextAuth uses `CredentialsProvider` with email/password.
- Session strategy is JWT.
- `PrismaAdapter` is configured.
- Signup is a custom REST route at `POST /api/auth/signup`.
- `session.user.id` is injected through callbacks.
- Protected pages should use `requireAuth` from `src/server/requireAuth.ts`.

Important: server-side props must be JSON-serializable. `requireAuth` normalizes optional session user fields such as `name`, `email`, and `image` to `null` to avoid Next.js serialization errors.

### tRPC Procedures

Defined in `src/server/api/trpc.ts`:

| Procedure | Auth Required | Description |
|---|---|---|
| `publicProcedure` | No | Public endpoint base |
| `protectedProcedure` | Yes | Requires valid session |

### Authorization

Project-scoped authorization is enforced in procedures through `verifyProjectMembership()` exported from `src/server/api/routers/project.ts`.

```ts
await verifyProjectMembership(ctx.db, projectId, ctx.session.user.id);
await verifyProjectMembership(ctx.db, projectId, ctx.session.user.id, ["OWNER", "ADMIN"]);
```

Never rely on Supabase RLS for app authorization; Prisma bypasses it.

## 5. tRPC Router Reference

All routers are registered in `src/server/api/root.ts`.

```ts
export const appRouter = createTRPCRouter({
  project: projectRouter,
  task: taskRouter,
  tag: tagRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
});
```

### Auth Router

- `auth.getProfile`
- `auth.updateProfile`

### Project Router

- `project.create`
- `project.list`
- `project.getById`
- `project.update`
- `project.delete`
- `project.addMember`
- `project.removeMember`
- `project.updateMemberRole`

### Task Router

- `task.create`
- `task.list`
- `task.getById`
- `task.update`
- `task.delete`
- `task.assign`
- `task.updateStatus`

### Tag Router

- `tag.create`
- `tag.list`
- `tag.update`
- `tag.delete`
- `tag.addToTask`
- `tag.removeFromTask`

### Dashboard Router

- `dashboard.getStats`
- `dashboard.getUpcomingDeadlines`
- `dashboard.getRecentActivity`
- `dashboard.getMyTasks`

## 6. UI Implementation Status

Phase 4 is complete.

### Built Pages

- `/` - landing page; authenticated users redirect to `/dashboard`
- `/auth/signin` - sign in
- `/auth/signup` - create account
- `/dashboard` - stats, upcoming deadlines, recent activity, assigned tasks
- `/projects` - project grid
- `/projects/new` - project creation
- `/projects/[id]` - Kanban task board
- `/projects/[id]/settings` - project details, members, roles, tags, delete project
- `/projects/[id]/tasks/[taskId]` - task detail, edit, delete
- `/profile` - profile update page

### Built Components

- Layout: `AppLayout`, `Sidebar`, `Header`
- UI primitives: `Button`, `ButtonLink`, `Input`, `Textarea`, `Select`, `Modal`, `Avatar`, `Badge`, `EmptyState`
- Task UI: `TaskBoard`, `TaskCard`, `TaskForm`, `TaskFilters`
- Tag UI: `TagBadge`, `TagPicker`

### UI Style

Authenticated pages use a clean, light SaaS-style interface. No new UI dependencies were added for Phase 4. Drag-and-drop uses native browser drag events and each task card also has a status select fallback.

## 7. Database Schema Summary

The schema is defined in `prisma/schema.prisma`.

| Model | Purpose |
|---|---|
| `User` | User accounts with optional hashed password |
| `Account` | NextAuth account table |
| `Session` | NextAuth session table |
| `VerificationToken` | NextAuth verification token table |
| `Project` | Top-level task container |
| `ProjectMember` | User/project membership with role |
| `Task` | Project task with status, priority, deadline, assignee |
| `Tag` | Project-scoped tag |
| `TaskTag` | Many-to-many task/tag join |

Enums:

- `ProjectRole`: `OWNER`, `ADMIN`, `MEMBER`
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

## 8. Development Setup

```bash
npm install
cp .env.example .env
./start-database.sh
npx prisma migrate dev
npm run dev
```

Recommended Node.js version: **24.x (LTS)**.

Available scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:generate` | Prisma migrate dev |
| `npm run db:migrate` | Prisma migrate deploy |
| `npm run db:push` | Prisma db push |
| `npm run db:studio` | Prisma Studio |

## 9. Coding Conventions

- Keep TypeScript strict and type-safe.
- Use inline type imports where appropriate: `import { type Foo } from "bar"`.
- Keep dependencies exact-versioned.
- Use `TRPCError` for API errors.
- Use Zod schemas for procedure inputs.
- Use `api.<router>.<procedure>.useQuery()` and `.useMutation()` for frontend data access.
- Use shared components before adding new local UI patterns.
- Keep protected pages on `getServerSideProps = requireAuth`.

## 10. How to Add New Features

### Add a tRPC Router

1. Create `src/server/api/routers/<name>.ts`.
2. Use `createTRPCRouter` and `protectedProcedure` or `publicProcedure`.
3. Validate inputs with Zod.
4. Use `verifyProjectMembership()` for project-scoped data.
5. Register the router in `src/server/api/root.ts`.

### Add a Page

1. Add the page in `src/pages/`.
2. For authenticated pages, export `getServerSideProps = requireAuth`.
3. Use `AppLayout` for authenticated app screens.
4. Use tRPC hooks from `~/utils/api`.
5. Invalidate relevant queries after mutations.

### Modify the Database Schema

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <name>`.
3. Run `npx prisma generate` if needed.
4. Update relevant routers, docs, and tests.

### Add Environment Variables

1. Add validation in `src/env.js`.
2. Add runtime mapping in `runtimeEnv`.
3. Add the variable to `.env.example`.
4. Prefix client-side variables with `NEXT_PUBLIC_`.

## 11. Project Status

| Phase | Description | Status |
|---|---|---|
| 1 | Project Setup & Foundation | Complete |
| 2 | Authentication | Complete |
| 3 | Core Features API | Complete |
| 4 | UI/UX Implementation | Complete |
| 5 | Testing | Complete |
| 6 | Deployment with SST/AWS & CI/CD | Complete |
| 7 | Documentation & Polish | Complete |

### Built

- Full Prisma schema and initial migration
- Credentials auth with signup/signin
- Protected app shell
- Project, task, tag, auth, and dashboard tRPC routers
- Project CRUD and member/role management
- Task CRUD, filtering, assignment, status updates, and Kanban UI
- Tag CRUD and task tag selection
- Dashboard, profile, and project/task UI pages
- Vitest unit tests for password helpers, signup validation, project router CRUD, task router CRUD, and non-member authorization
- `npm run lint` and `npm run build` verified after Phase 4
- `npm run test`, `npm run lint`, and `npm run build` verified after Phase 5
- SST v3 initialized and deployed to AWS
- GitHub Actions CI/CD pipeline implemented with AWS OIDC
- Final documentation, testing, and polish completed

### Remaining

- None. The project is fully complete.

## 12. Common Gotchas

1. Do not use App Router patterns.
2. Credentials auth requires JWT sessions.
3. Signup is REST, not tRPC.
4. Keep authorization in tRPC procedures.
5. Do not break the cross-router import of `verifyProjectMembership()`.
6. Use `requireAuth` for protected pages to avoid duplicated auth redirect logic and session serialization bugs.
7. Prisma Client may need regeneration after schema changes.
8. tRPC uses SuperJSON on both client and server.
9. Production Supabase should use pooled `DATABASE_URL` for runtime and direct `DIRECT_URL` for migrations.
10. Phase 4 intentionally added no new npm dependencies.
11. Deployment requires `AWS_OIDC_ROLE_ARN` secret in GitHub for the CI/CD pipeline.
12. SST secrets must be set for the `production` stage via `npx sst secret set`.

## 13. AI Agent Workflow Instructions

If you are an AI coding agent working in this repository, follow this workflow:

1. **Verify Your Changes:** Before concluding your turn, run `npm run lint`, `npm run build`, and `npm run test` to ensure your code changes did not introduce regressions.
2. **Database Schema Changes:** If you modify `prisma/schema.prisma`, immediately run `npx prisma format` and `npx prisma generate` to keep the client types up-to-date. Create migrations via `npx prisma migrate dev --name <description>`.
3. **Styling:** Rely solely on Tailwind CSS utility classes. Do not introduce custom CSS in `globals.css` unless defining new theme tokens or global base resets.
4. **Component Generation:** Use functional React components with strict TypeScript interfaces. Destructure props and leverage the `cn()` utility (`src/utils/cn.ts`) for merging Tailwind classes.
5. **API Integration:** For new frontend data fetching or mutations, always use the strongly-typed `api` object from `~/utils/api`. Do not write raw `fetch` calls.
6. **Tool Usage:** Prefer file edits using targeted replace tools rather than full file rewrites. Do not write untested logic for complex data transformations.
