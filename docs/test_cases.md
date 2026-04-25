# Test Cases — Task Management & Collaboration Tool

Based on requirements from `docs/plan.md`, `docs/api-reference.md`, `docs/architecture.md`, and `task.txt`.

---

## Phase 1: Project Setup & Foundation

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | T3 app scaffolded with correct options (TS, Tailwind, tRPC, NextAuth, Prisma, Pages Router, PostgreSQL) | ✅ Done | `ct3aMetadata.initVersion: 7.37.0` in package.json |
| 1.2 | Git repository initialized | ✅ Done | `.git/` exists |
| 1.3 | `.env` file created with `DATABASE_URL` pointing to PostgreSQL | ✅ Done | Points to `localhost:5432` |
| 1.4 | `.env` file has `DIRECT_URL` for Prisma migrations | ✅ Done | Added during setup |
| 1.5 | Prisma schema has `password` field on `User` model | ✅ Done | `password String?` in schema |
| 1.6 | Prisma schema has `Project` model | ✅ Done | With owner relation |
| 1.7 | Prisma schema has `ProjectMember` model with `ProjectRole` enum | ✅ Done | OWNER, ADMIN, MEMBER |
| 1.8 | Prisma schema has `Task` model with `TaskStatus` and `TaskPriority` enums | ✅ Done | TODO, IN_PROGRESS, IN_REVIEW, DONE / LOW, MEDIUM, HIGH, URGENT |
| 1.9 | Prisma schema has `Tag` and `TaskTag` models | ✅ Done | Many-to-many join table |
| 1.10 | Initial migration created and applied | ✅ Done | `20260425162350_init` migration exists |
| 1.11 | App builds and runs locally with `npm run dev` | ✅ Done | Verified by user |
| 1.12 | Tailwind CSS configured and working | ✅ Done | Default T3 setup |
| 1.13 | SST initialized (`sst.config.ts`) | ❌ Not Done | Not yet configured |
| 1.14 | `NEXTAUTH_SECRET` set in `.env` | ✅ Done | Generated and configured |

---

## Phase 2: Authentication

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | NextAuth configured with Credentials provider (not Discord) | ✅ Done | Discord removed, Credentials added |
| 2.2 | Session strategy set to `jwt` | ✅ Done | In `auth.ts` |
| 2.3 | Prisma Adapter configured for NextAuth | ✅ Done | `PrismaAdapter(db)` |
| 2.4 | Session callback includes `user.id` | ✅ Done | Via JWT callback |
| 2.5 | `bcryptjs` installed for password hashing | ✅ Done | In `dependencies` |
| 2.6 | Signup API route exists at `/api/auth/signup` | ✅ Done | `src/pages/api/auth/signup.ts` |
| 2.7 | Signup validates email format | ✅ Done | Zod `z.string().email()` |
| 2.8 | Signup validates password min length (6 chars) | ✅ Done | Zod `z.string().min(6)` |
| 2.9 | Signup hashes password before storing | ✅ Done | `bcrypt.hash(password, 12)` |
| 2.10 | Signup prevents duplicate email registration | ✅ Done | Checks `findUnique` → returns 409 |
| 2.11 | Signup returns 201 on success | ✅ Done | With user info (no password) |
| 2.12 | Signup returns 400 on validation error | ✅ Done | Zod error message |
| 2.13 | Signup returns 405 on non-POST request | ✅ Done | Method check |
| 2.14 | Sign-in page exists at `/auth/signin` | ✅ Done | Custom page with form |
| 2.15 | Sign-up page exists at `/auth/signup` | ✅ Done | Custom page with form |
| 2.16 | Sign-in page has email and password fields | ✅ Done | With validation |
| 2.17 | Sign-up page has name, email, password, confirm password fields | ✅ Done | With matching check |
| 2.18 | Sign-in shows error on invalid credentials | ✅ Done | Error state displayed |
| 2.19 | Sign-in redirects to `/` on success | ✅ Done | `router.push("/")` |
| 2.20 | Sign-up auto-signs in after successful registration | ✅ Done | Calls `signIn()` after signup |
| 2.21 | Sign-in page links to sign-up page | ✅ Done | Link at bottom |
| 2.22 | Sign-up page links to sign-in page | ✅ Done | Link at bottom |
| 2.23 | Authenticated users are redirected away from auth pages | ✅ Done | `getServerSideProps` checks session |
| 2.24 | `authorize` function queries user by email and compares password hash | ✅ Done | In Credentials provider |
| 2.25 | Discord provider fully removed from codebase | ✅ Done | Removed from auth.ts, env.js, .env |

---

## Phase 3: Core Features — tRPC Routers

### Project Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.1 | `project.create` — Creates project, caller added as OWNER | ❌ Not Done | Router not yet created |
| 3.2 | `project.list` — Returns all projects user is a member of | ❌ Not Done | |
| 3.3 | `project.getById` — Returns project details with members | ❌ Not Done | |
| 3.4 | `project.update` — Only OWNER/ADMIN can update | ❌ Not Done | |
| 3.5 | `project.delete` — Only OWNER can delete (cascade) | ❌ Not Done | |
| 3.6 | `project.addMember` — Adds user by email | ❌ Not Done | |
| 3.7 | `project.removeMember` — Cannot remove OWNER | ❌ Not Done | |
| 3.8 | `project.updateMemberRole` — Only OWNER can change roles | ❌ Not Done | |

### Task Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.9 | `task.create` — Creates task within project (must be member) | ❌ Not Done | Router not yet created |
| 3.10 | `task.list` — Lists tasks with filters (status, priority, assignee, tags) | ❌ Not Done | |
| 3.11 | `task.getById` — Returns task with tags, assignee, creator | ❌ Not Done | |
| 3.12 | `task.update` — Updates task fields | ❌ Not Done | |
| 3.13 | `task.delete` — Deletes task | ❌ Not Done | |
| 3.14 | `task.assign` — Assigns task to project member | ❌ Not Done | |
| 3.15 | `task.updateStatus` — Quick status change | ❌ Not Done | |

### Tag Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.16 | `tag.create` — Creates tag in project | ❌ Not Done | Router not yet created |
| 3.17 | `tag.list` — Lists tags for a project | ❌ Not Done | |
| 3.18 | `tag.update` — Updates tag name/color | ❌ Not Done | |
| 3.19 | `tag.delete` — Deletes tag | ❌ Not Done | |
| 3.20 | `tag.addToTask` — Associates tag with task | ❌ Not Done | |
| 3.21 | `tag.removeFromTask` — Removes tag from task | ❌ Not Done | |

### Auth Router (tRPC)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.22 | `auth.getProfile` — Returns current user profile | ❌ Not Done | Router not yet created |
| 3.23 | `auth.updateProfile` — Updates name, image | ❌ Not Done | |

### Root Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.24 | All routers merged in `root.ts` | ❌ Not Done | Currently only has boilerplate `postRouter` |

---

## Phase 4: UI/UX Implementation

### Layout & Navigation

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.1 | `AppLayout` with sidebar navigation exists | ❌ Not Done | |
| 4.2 | `Sidebar` with project list and quick navigation | ❌ Not Done | |
| 4.3 | `Header` with user avatar, dropdown, logout | ❌ Not Done | |

### Project Pages

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.4 | Projects list page (`/projects`) — grid of project cards | ❌ Not Done | |
| 4.5 | New project page (`/projects/new`) — create form | ❌ Not Done | |
| 4.6 | Project detail page (`/projects/[id]`) — task board (Kanban) | ❌ Not Done | |
| 4.7 | Project settings page (`/projects/[id]/settings`) — member management | ❌ Not Done | |

### Task Components

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.8 | `TaskBoard` — Kanban columns (TODO, IN_PROGRESS, IN_REVIEW, DONE) | ❌ Not Done | |
| 4.9 | `TaskCard` — Summary with title, assignee, priority, tags, deadline | ❌ Not Done | |
| 4.10 | `TaskForm` — Create/edit form with all fields | ❌ Not Done | |
| 4.11 | `TaskDetail` — Full detail view page | ❌ Not Done | |

### Profile Page

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.12 | User profile page (`/profile`) — edit name, email, image | ❌ Not Done | |

### Dashboard (Optional)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.13 | Dashboard page (`/dashboard`) with stats | ❌ Not Done | Optional |
| 4.14 | Task count by status (stats cards) | ❌ Not Done | Optional |
| 4.15 | Upcoming deadlines timeline | ❌ Not Done | Optional |
| 4.16 | Recent activity feed | ❌ Not Done | Optional |

---

## Phase 5: Unit Tests (Code)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Test framework (Vitest) installed and configured | ❌ Not Done | |
| 5.2 | Test: Password hashing produces valid bcrypt hash | ❌ Not Done | |
| 5.3 | Test: Password comparison succeeds with correct password | ❌ Not Done | |
| 5.4 | Test: Password comparison fails with wrong password | ❌ Not Done | |
| 5.5 | Test: Signup validation rejects invalid email | ❌ Not Done | |
| 5.6 | Test: Signup validation rejects short password (< 6 chars) | ❌ Not Done | |
| 5.7 | Test: Signup validation accepts valid input | ❌ Not Done | |
| 5.8 | Test: Task CRUD operations work correctly | ❌ Not Done | |
| 5.9 | Test: Project CRUD operations work correctly | ❌ Not Done | |
| 5.10 | Test: Non-member cannot access project tasks | ❌ Not Done | |

---

## Phase 6: Deployment

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 6.1 | AWS credentials configured | ❌ Not Done | Later |
| 6.2 | SST deploy to staging succeeds | ❌ Not Done | Later |
| 6.3 | All features work on staging URL | ❌ Not Done | Later |
| 6.4 | SST deploy to production succeeds | ❌ Not Done | Later |

---

## Phase 7: Documentation & Polish

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 7.1 | `README.md` has project overview | ✅ Done | Updated |
| 7.2 | `README.md` has tech stack summary | ✅ Done | Updated |
| 7.3 | `README.md` has local development setup instructions | ✅ Done | Updated |
| 7.4 | `README.md` has environment variables guide | ✅ Done | Updated |
| 7.5 | `README.md` has deployment instructions | ✅ Done | Updated |
| 7.6 | ESLint passes with no warnings | ❌ Not Done | |
| 7.7 | TypeScript strict checks pass | ❌ Not Done | |
| 7.8 | No unused code or console.logs | ❌ Not Done | |

---

## Summary

| Phase | Total | Done | Remaining |
|-------|-------|------|-----------|
| Phase 1: Setup & Foundation | 14 | 13 | 1 |
| Phase 2: Authentication | 25 | 25 | 0 |
| Phase 3: Core Features (API) | 24 | 0 | 24 |
| Phase 4: UI/UX | 16 | 0 | 16 |
| Phase 5: Unit Tests | 10 | 0 | 10 |
| Phase 6: Deployment | 4 | 0 | 4 |
| Phase 7: Documentation | 8 | 5 | 3 |
| **Total** | **101** | **43** | **58** |
