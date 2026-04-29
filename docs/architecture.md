# Architecture — Task Management & Collaboration Tool

## 1. System Overview

A full-stack task management and collaboration application allowing teams to create, assign, track, and manage tasks with deadlines, priorities, tags, and team member assignments.

```mermaid
graph TB
    subgraph Client["Browser (Client)"]
        UI["Next.js Pages Router + React"]
        TRPC_C["tRPC Client"]
    end

    subgraph AWS["AWS (via SST / OpenNext)"]
        CF["CloudFront CDN"]
        LB["Lambda@Edge / Lambda"]
        S3["S3 (Static Assets)"]
    end

    subgraph Backend["Backend (Server-Side)"]
        TRPC_S["tRPC Server (API Routes)"]
        NA["NextAuth.js (Credentials Provider)"]
        PRISMA["Prisma ORM"]
    end

    subgraph DB["Supabase"]
        PG["PostgreSQL Database"]
    end

    UI --> TRPC_C
    TRPC_C --> CF
    CF --> LB
    CF --> S3
    LB --> TRPC_S
    TRPC_S --> NA
    TRPC_S --> PRISMA
    NA --> PRISMA
    PRISMA --> PG
```

---

## 2. Tech Stack (Mandated)

| Layer | Technology | Version / Notes |
|---|---|---|
| **Framework** | Next.js (Pages Router) | T3 scaffold, **no** App Router |
| **Language** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS | As specified in task |
| **API Layer** | tRPC | End-to-end typesafe RPC |
| **Auth** | NextAuth.js | Credentials provider (email + password) |
| **ORM** | Prisma | PostgreSQL provider |
| **Database** | Supabase (PostgreSQL) | Managed Postgres, connection pooler |
| **Deployment** | SST (Serverless Stack) | Deploys to AWS via `sst.aws.Nextjs` + OpenNext |
| **Cloud** | AWS | Lambda, CloudFront, S3 |
| **Scaffold** | `npm create t3-app@7.37.0` | Exact version specified |

---

## 3. Project Scaffold Options

```
npm create t3-app@7.37.0
  ◇ TypeScript
  ◇ Tailwind CSS — Yes
  ◇ tRPC — Yes
  ◇ NextAuth.js
  ◇ Prisma
  ◇ App Router — No (Pages Router)
  ◇ PostgreSQL
```

---

## 4. Database Schema (ERD)

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String password
        String image
        DateTime createdAt
        DateTime updatedAt
    }

    Project {
        String id PK
        String name
        String description
        String ownerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ProjectMember {
        String id PK
        String projectId FK
        String userId FK
        String role
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status
        String priority
        DateTime deadline
        String projectId FK
        String creatorId FK
        String assigneeId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Tag {
        String id PK
        String name UK
        String color
        String projectId FK
    }

    TaskTag {
        String taskId FK
        String tagId FK
    }

    Session {
        String id PK
        String sessionToken UK
        String userId FK
        DateTime expires
    }

    Account {
        String id PK
        String userId FK
        String type
        String provider
        String providerAccountId
    }

    User ||--o{ Project : "owns"
    User ||--o{ ProjectMember : "belongs to"
    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ Task : "contains"
    Project ||--o{ Tag : "has tags"
    User ||--o{ Task : "creates"
    User ||--o{ Task : "assigned to"
    Task ||--o{ TaskTag : "tagged with"
    Tag ||--o{ TaskTag : "applied to"
    User ||--o{ Session : "has"
    User ||--o{ Account : "has"
```

### Key Schema Decisions

| Decision | Rationale |
|---|---|
| `User.password` field added to default NextAuth schema | Required for Credentials provider (email/password login) |
| Passwords hashed with `bcryptjs` | Industry standard; no plain-text storage |
| `Project` as a top-level entity | Tasks are scoped to projects for multi-team collaboration |
| `ProjectMember` join table with `role` | Supports roles like `OWNER`, `ADMIN`, `MEMBER` |
| `Task.status` as enum string | Values: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `Task.priority` as enum string | Values: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| Separate `Tag` + `TaskTag` tables | Many-to-many relationship, project-scoped tags |
| `Session` + `Account` tables | Standard NextAuth / Prisma Adapter schema |
| Supabase connection pooler (port 6543) for `DATABASE_URL` | Prevents connection exhaustion in serverless Lambda |
| `DIRECT_URL` (port 5432) for Prisma migrations | Migrations need direct connection, not pooled |
| RLS enabled with no permissive policies | Blocks direct Supabase Data API access to app tables |

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant NA as NextAuth.js
    participant P as Prisma
    participant DB as Supabase PostgreSQL

    Note over B: Registration Flow
    B->>NA: POST /api/auth/signup (email, password)
    NA->>P: Hash password with bcryptjs
    P->>DB: INSERT User
    DB-->>P: User created
    P-->>NA: Success
    NA-->>B: Redirect to login

    Note over B: Login Flow
    B->>NA: POST /api/auth/signin (credentials)
    NA->>P: findUnique by email
    P->>DB: SELECT User
    DB-->>P: User record
    P-->>NA: User object
    NA->>NA: bcrypt.compare password with hash
    NA-->>B: JWT session token via cookie

    Note over B: Authenticated Request
    B->>NA: tRPC call with session cookie
    NA->>NA: Validate JWT
    NA-->>B: ctx.session.user available in tRPC procedures
```

### Auth Design Choices

- **NextAuth.js Credentials Provider** — The task requires email/password login, so we use the Credentials provider rather than OAuth.
- **JWT Session Strategy** — Since Credentials provider doesn't natively support database sessions in NextAuth, we use `strategy: "jwt"`.
- **Prisma Adapter** — Manages the `User`, `Account`, and `Session` tables for NextAuth's internal needs.
- **Signup API Route** — NextAuth doesn't have a built-in signup flow; we create a custom `/api/auth/signup` route that hashes the password and creates the user via Prisma.

---

## 6. tRPC Router Structure

```
src/server/api/
├── root.ts              # Merges all routers
├── trpc.ts              # tRPC initialization, context, middleware
└── routers/
    ├── auth.ts          # Signup (custom), profile management
    ├── project.ts       # CRUD for projects, member management
    ├── task.ts          # CRUD for tasks, assignment, status updates
    ├── tag.ts           # CRUD for tags, task-tag associations
    └── dashboard.ts     # Aggregation queries for dashboard (optional)
```

### Middleware Layers

| Middleware | Purpose |
|---|---|
| `publicProcedure` | Unauthenticated routes (signup, health check) |
| `protectedProcedure` | Requires valid session (injected `ctx.session.user`) |
| `projectMemberProcedure` | Requires authenticated user + membership in the target project |

---

## 7. Page Structure (Pages Router)

```
src/pages/
├── _app.tsx                 # Session provider, tRPC provider, global layout
├── index.tsx                # Landing / redirect to dashboard
├── auth/
│   ├── signin.tsx           # Login page
│   └── signup.tsx           # Registration page
├── dashboard/
│   └── index.tsx            # Central dashboard (optional feature)
├── projects/
│   ├── index.tsx            # List all projects
│   ├── new.tsx              # Create project
│   └── [projectId]/
│       ├── index.tsx        # Project detail / task board
│       ├── settings.tsx     # Project settings, member management
│       └── tasks/
│           ├── new.tsx      # Create task
│           └── [taskId].tsx # Task detail / edit
└── profile/
    └── index.tsx            # User profile & preferences
```

---

## 8. AWS Infrastructure (via SST)

```mermaid
graph LR
    subgraph SST["sst.config.ts"]
        NJ["sst.aws.Nextjs"]
    end

    subgraph AWS["AWS Account"]
        CF["CloudFront Distribution"]
        S3B["S3 Bucket (Static Assets)"]
        LF["Lambda Function (SSR + API)"]
    end

    subgraph Supabase["Supabase (External)"]
        PG["PostgreSQL"]
    end

    NJ --> CF
    NJ --> S3B
    NJ --> LF
    LF -->|DATABASE_URL| PG
```

### `sst.config.ts` (High-Level)

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "task-management",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("TaskManagementWeb", {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
      },
    });
  },
});
```

### Environment Variables

| Variable | Source | Purpose |
|---|---|---|
| `DATABASE_URL` | Supabase Dashboard -> Settings -> Database | Pooled connection string for the dedicated `prisma` role (port 6543) |
| `DIRECT_URL` | Supabase Dashboard -> Settings -> Database | Direct/session connection for Prisma migrations with the dedicated `prisma` role (port 5432) |
| `NEXTAUTH_SECRET` | Generated (`openssl rand -base64 32`) | JWT signing secret |
| `NEXTAUTH_URL` | CloudFront domain or custom domain | Base URL for NextAuth callbacks |

---

## 9. Component Architecture (UI)

```
src/components/
├── layout/
│   ├── AppLayout.tsx        # Sidebar + main content wrapper
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── Header.tsx           # Top bar with user menu
├── auth/
│   ├── LoginForm.tsx        # Email/password login form
│   └── SignupForm.tsx       # Registration form
├── projects/
│   ├── ProjectCard.tsx      # Project summary card
│   └── ProjectForm.tsx      # Create/edit project form
├── tasks/
│   ├── TaskBoard.tsx        # Kanban-style task board
│   ├── TaskCard.tsx         # Individual task card
│   ├── TaskForm.tsx         # Create/edit task form
│   ├── TaskFilters.tsx      # Filter by status, priority, assignee, tags
│   └── TaskDetail.tsx       # Full task detail view
├── tags/
│   ├── TagBadge.tsx         # Colored tag badge
│   └── TagPicker.tsx        # Multi-select tag picker
├── profile/
│   └── ProfileForm.tsx      # Edit user profile
├── dashboard/
│   ├── StatsCards.tsx       # Task count summaries
│   ├── DeadlineTimeline.tsx # Upcoming deadlines
│   └── RecentActivity.tsx   # Recent task updates
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── Modal.tsx
    ├── DatePicker.tsx
    └── Avatar.tsx
```

---

## 10. Key Integration Points & Gotchas

### ⚠️ Supabase + Prisma in Serverless
- Always use the **connection pooler URL** (port `6543`, Transaction Mode) for `DATABASE_URL` in production/Lambda.
- Use the **direct URL** (port `5432`) only for `DIRECT_URL` (used by `prisma migrate`).
- Use the dedicated `prisma` database role documented in `docs/supabase-security.md`.
- RLS is enabled on app tables with no permissive policies to block direct Supabase Data API access.
- Application authorization must still be handled in tRPC middleware; do not depend on Supabase Auth `auth.uid()` policies because this app uses NextAuth.
- Remove `public` from Supabase exposed schemas if the app remains Prisma-only.

### ❗ NextAuth Credentials Provider Limitations
- NextAuth does not provide a built-in signup page or API route for the Credentials provider. You must implement `/api/auth/signup` manually.
- The Credentials provider requires `strategy: "jwt"` for sessions (database sessions are not supported with Credentials).
- The `PrismaAdapter` still manages User/Account/Session tables, but JWT is the active session mechanism.

### ℹ️ SST Deployment
- SST uses OpenNext to package the Next.js app for AWS Lambda + CloudFront + S3.
- `sst dev` enables live Lambda development with hot reload.
- `sst deploy --stage production` deploys to the production stage.
- Environment variables are passed via `sst.config.ts` or SST secrets.
