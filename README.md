# Task Management & Collaboration Tool

A full-stack task management and collaboration app built with the T3 Stack. Teams can create projects, manage members, organize tasks on a Kanban board, assign work, set priorities and deadlines, and use project-scoped tags.

## Tech Stack

- **Framework:** Next.js 14, Pages Router
- **Language:** TypeScript, strict mode
- **Styling:** Tailwind CSS
- **API:** tRPC v11 with SuperJSON
- **Auth:** NextAuth.js v4, Credentials provider
- **ORM:** Prisma v5
- **Database:** PostgreSQL
- **Package Manager:** npm with exact dependency versions

## Current Features

- Email/password sign-up and sign-in
- Protected authenticated app shell with sidebar and header
- Dashboard with task stats, upcoming deadlines, recent activity, and assigned tasks
- Project list and project creation
- Project detail Kanban board with filters
- Native drag-and-drop status updates with status select fallback
- Task create, detail, edit, delete, assignment, priority, deadline, and tag selection
- Project settings for editing details, deleting projects, managing members/roles, and managing tags
- Profile page for name and image URL updates
- Role-aware authorization enforced in tRPC procedures

## Local Setup

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Docker, optional for local PostgreSQL

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` from `.env.example` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/task-management-app"
DIRECT_URL="postgresql://postgres:password@localhost:5432/task-management-app"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Database

```bash
chmod +x start-database.sh
./start-database.sh
```

### 4. Run Migrations

```bash
npx prisma migrate dev
```

### 5. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production app |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Run Prisma migrate dev |
| `npm run db:migrate` | Deploy Prisma migrations |
| `npm run db:push` | Push Prisma schema without migration |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

| Path | Purpose |
|---|---|
| `src/pages/` | Next.js Pages Router pages and API routes |
| `src/pages/auth/` | Sign-in and sign-up pages |
| `src/pages/projects/` | Project list, create, board, settings, and task detail pages |
| `src/pages/dashboard.tsx` | Authenticated dashboard |
| `src/pages/profile.tsx` | User profile page |
| `src/components/layout/` | App shell, sidebar, and header |
| `src/components/tasks/` | Task board, cards, filters, and forms |
| `src/components/tags/` | Tag badge and picker |
| `src/components/ui/` | Reusable UI primitives |
| `src/server/api/routers/` | tRPC routers |
| `src/server/requireAuth.ts` | Shared protected-page server-side auth guard |
| `prisma/schema.prisma` | Database schema |
| `docs/` | Architecture, API, setup, test cases, and planning docs |

## API Overview

All application APIs are type-safe tRPC procedures except sign-up, which is a REST endpoint at `POST /api/auth/signup`.

| Router | Procedures | Description |
|---|---:|---|
| `auth` | 2 | Profile read/update |
| `project` | 8 | Project CRUD and member/role management |
| `task` | 7 | Task CRUD, assignment, filters, and status updates |
| `tag` | 6 | Project tags and task tag associations |
| `dashboard` | 4 | Stats, upcoming deadlines, recent activity, and assigned tasks |

## Main Routes

| Route | Description |
|---|---|
| `/` | Landing page; redirects authenticated users to `/dashboard` |
| `/auth/signin` | Sign in |
| `/auth/signup` | Create account |
| `/dashboard` | Authenticated dashboard |
| `/projects` | Project list |
| `/projects/new` | Create project |
| `/projects/[id]` | Project Kanban board |
| `/projects/[id]/settings` | Project details, members, roles, and tags |
| `/projects/[id]/tasks/[taskId]` | Task detail and edit page |
| `/profile` | User profile |

## Progress

| Phase | Status |
|---|---|
| Phase 1: Setup & Foundation | Complete |
| Phase 2: Authentication | Complete |
| Phase 3: Core Features API | Complete |
| Phase 4: UI/UX Implementation | Complete |
| Phase 5: Unit Tests | In progress |
| Phase 6: Deployment | Not started |
| Phase 7: Documentation & Polish | In progress |

## Verification

The current Phase 4 implementation has been verified with:

```bash
npm run lint
npm run build
```

## Deployment

SST/AWS deployment is planned for Phase 6. Production database configuration is expected to use Supabase PostgreSQL with pooled `DATABASE_URL` for runtime and direct `DIRECT_URL` for migrations.
