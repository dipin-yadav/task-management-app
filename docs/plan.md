# Implementation Plan — Task Management & Collaboration Tool

## Overview

Build a full-stack task management tool using the T3 stack, deployed on AWS via SST, with Supabase as the database backend. The project demonstrates proficiency in Next.js, TypeScript, tRPC, Prisma, NextAuth.js, and serverless AWS deployment.

---

## Phase 1: Project Setup & Foundation

> **Goal:** Scaffold the T3 app, configure Supabase, and get the development environment running.

### 1.1 Scaffold the T3 App
- Run `npm create t3-app@7.37.0` with the specified options
- Verify the project builds and runs locally (`npm run dev`)
- Initialize git repository

### 1.2 Set Up Supabase
- Create a Supabase project (free tier is sufficient for development)
- Obtain the PostgreSQL connection strings:
  - **Pooled URL** (port 6543) → `DATABASE_URL`
  - **Direct URL** (port 5432) → `DIRECT_URL`
- Create `.env` file with connection strings

### 1.3 Configure Prisma
- Update `prisma/schema.prisma` with:
  - `postgresql` provider
  - `DATABASE_URL` and `DIRECT_URL`
- Extend the default NextAuth schema with `User.password` field
- Add `Project`, `ProjectMember`, `Task`, `Tag`, `TaskTag` models
- Run `npx prisma migrate dev` to create initial migration
- Verify schema in Supabase Dashboard

### 1.4 Initialize SST
- Run `npx sst@latest init` in the project root
- Configure `sst.config.ts` with `sst.aws.Nextjs`
- Set up environment variables for SST
- Test local dev with `sst dev` (requires AWS credentials)

### 1.5 Configure Tailwind CSS
- Verify Tailwind is working (already set up by T3)
- Customize `tailwind.config.ts` with project color palette
- Set up base styles and design tokens

---

## Phase 2: Authentication

> **Goal:** Implement email/password auth with NextAuth.js Credentials provider.

### 2.1 Configure NextAuth
- Set up Credentials provider in `src/server/auth.ts`
- Configure JWT session strategy
- Set up Prisma Adapter
- Configure session callbacks to include `user.id`

### 2.2 Build Signup Flow
- Create custom API route: `src/pages/api/auth/signup.ts`
  - Validate email format and password strength
  - Hash password with `bcryptjs`
  - Create user via Prisma
  - Return success/error response
- Create signup page: `src/pages/auth/signup.tsx`
  - Email, password, confirm password fields
  - Client-side validation
  - Error handling and display

### 2.3 Build Login Flow
- Customize login page: `src/pages/auth/signin.tsx`
  - Email and password fields
  - Error handling for invalid credentials
  - "Remember me" option
- Implement `authorize` function in Credentials provider
  - Query user by email via Prisma
  - Compare password hash with `bcryptjs`
  - Return user object or null

### 2.4 Session & Route Protection
- Set up `getServerSideProps` helpers for protected pages
- Create auth redirect logic (unauthenticated → `/auth/signin`)
- Add session info to tRPC context

---

## Phase 3: Core Features — Projects & Tasks

> **Goal:** Implement CRUD for projects and tasks with tRPC.

### 3.1 Project Management (tRPC Router)
- `project.create` — Create a new project (user becomes OWNER)
- `project.list` — List all projects the user is a member of
- `project.getById` — Get project details with members
- `project.update` — Update project name/description (OWNER/ADMIN only)
- `project.delete` — Delete project and all associated data (OWNER only)
- `project.addMember` — Invite user to project by email
- `project.removeMember` — Remove member from project
- `project.updateMemberRole` — Change member role

### 3.2 Task Management (tRPC Router)
- `task.create` — Create task within a project
- `task.list` — List tasks with filters (status, priority, assignee, tags)
- `task.getById` — Get full task details
- `task.update` — Update task fields (title, description, status, priority, deadline)
- `task.delete` — Delete a task
- `task.assign` — Assign/reassign a task to a project member
- `task.updateStatus` — Quick status change (for drag-and-drop)

### 3.3 Tag Management (tRPC Router)
- `tag.create` — Create a tag within a project
- `tag.list` — List tags for a project
- `tag.update` — Update tag name/color
- `tag.delete` — Delete a tag
- `tag.addToTask` — Associate tag with task
- `tag.removeFromTask` — Remove tag from task

---

## Phase 4: UI/UX Implementation

> **Goal:** Build all frontend pages and components.

### 4.1 Layout & Navigation
- Build `AppLayout` with sidebar navigation
- Build `Sidebar` with project list, quick navigation
- Build `Header` with user avatar, dropdown menu, logout

### 4.2 Project Pages
- **Projects List** (`/projects`) — Grid of project cards
- **New Project** (`/projects/new`) — Create project form
- **Project Detail** (`/projects/[id]`) — Task board view (Kanban-style)
- **Project Settings** (`/projects/[id]/settings`) — Manage members, edit project

### 4.3 Task Pages
- **Task Board** — Columns for TODO, IN_PROGRESS, IN_REVIEW, DONE
- **Task Card** — Summary with title, assignee avatar, priority badge, tags, deadline
- **Task Detail** (`/projects/[id]/tasks/[taskId]`) — Full detail view, edit in place
- **New Task** — Modal or page form with all fields

### 4.4 User Profile
- **Profile Page** (`/profile`) — Edit name, email, image
- **Preferences** — Notification settings (placeholder for future)

### 4.5 Dashboard (Optional)
- **Dashboard** (`/dashboard`) — Overview page with:
  - Task count by status (stats cards)
  - Upcoming deadlines (timeline)
  - Recent activity feed
  - Tasks assigned to current user

---

## Phase 5: Testing

> **Goal:** Write unit tests for critical functionality.

### 5.1 Test Setup
- Install and configure testing framework (Vitest or Jest)
- Set up test database or mocks for Prisma

### 5.2 Unit Tests
- **Auth:** Test password hashing, signup validation, login flow
- **tRPC Routers:** Test task CRUD, project CRUD, authorization checks
- **Utilities:** Test any helper functions (date formatting, validation)

### 5.3 Integration Tests (Optional)
- Test full API flow: signup → login → create project → create task
- Test authorization: non-member cannot access project tasks

---

## Phase 6: Deployment

> **Goal:** Deploy the application to AWS via SST.

### 6.1 AWS Setup
- Configure AWS credentials (`aws configure` or environment variables)
- Ensure proper IAM permissions for SST deployment

### 6.2 Deploy to Staging
- Run `sst deploy --stage staging`
- Verify all features work with the deployed URL
- Check CloudFront distribution, Lambda functions, S3 bucket

### 6.3 Deploy to Production
- Run `sst deploy --stage production`
- Set `NEXTAUTH_URL` to the production CloudFront domain
- Verify production deployment

### 6.4 Documentation
- Write comprehensive `README.md` with:
  - Project overview
  - Tech stack
  - Setup instructions (local development)
  - Environment variables
  - Database setup (Supabase)
  - Deployment instructions (SST + AWS)
  - Testing instructions
  - Architecture overview

---

## Phase 7: Polish & Submission

> **Goal:** Final review, cleanup, and submission.

### 7.1 Code Quality
- Run ESLint and fix warnings
- Run TypeScript strict checks
- Remove unused code, console.logs, TODOs

### 7.2 Final Review
- Test all user flows end-to-end
- Verify responsive design
- Check error handling and edge cases
- Verify deployment is live and accessible

### 7.3 Submit
- Push all code to GitHub
- Ensure README is comprehensive
- Share repository link

---

## Estimated Effort Breakdown

| Phase | Estimated Time | Priority |
|---|---|---|
| Phase 1: Setup & Foundation | 0.5–1 day | **Required** |
| Phase 2: Authentication | 0.5–1 day | **Required** |
| Phase 3: Core Features (API) | 1–1.5 days | **Required** |
| Phase 4: UI/UX | 1.5–2 days | **Required** |
| Phase 5: Testing | 0.5 day | **Required** |
| Phase 6: Deployment | 0.5–1 day | **Required** |
| Phase 7: Polish | 0.5 day | **Required** |
| **Total** | **~5–7 days** | — |
