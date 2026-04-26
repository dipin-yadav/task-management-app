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
| 3.1 | `project.create` — Creates project, caller added as OWNER | ✅ Done | Auto-creates ProjectMember with OWNER role |
| 3.2 | `project.list` — Returns all projects user is a member of | ✅ Done | Includes member/task count, ordered by updatedAt |
| 3.3 | `project.getById` — Returns project details with members | ✅ Done | Includes members with user info + task counts by status |
| 3.4 | `project.update` — Only OWNER/ADMIN can update | ✅ Done | `verifyProjectMembership` with role check |
| 3.5 | `project.delete` — Only OWNER can delete (cascade) | ✅ Done | OWNER-only, Prisma cascade handles cleanup |
| 3.6 | `project.addMember` — Adds user by email | ✅ Done | OWNER/ADMIN, checks duplicate + user exists |
| 3.7 | `project.removeMember` — Cannot remove OWNER | ✅ Done | Explicit OWNER role guard |
| 3.8 | `project.updateMemberRole` — Only OWNER can change roles | ✅ Done | Cannot change own role |

### Task Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.9 | `task.create` — Creates task within project (must be member) | ✅ Done | Validates assignee membership, connects tags |
| 3.10 | `task.list` — Lists tasks with filters (status, priority, assignee, tags) | ✅ Done | Plus case-insensitive search on title/description |
| 3.11 | `task.getById` — Returns task with tags, assignee, creator | ✅ Done | Includes project name |
| 3.12 | `task.update` — Updates task fields | ✅ Done | Tag sync via delete-all + recreate in transaction |
| 3.13 | `task.delete` — Deletes task | ✅ Done | Membership verified |
| 3.14 | `task.assign` — Assigns task to project member | ✅ Done | Validates assignee is project member |
| 3.15 | `task.updateStatus` — Quick status change | ✅ Done | For Kanban drag-and-drop |

### Tag Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.16 | `tag.create` — Creates tag in project | ✅ Done | Unique name per project enforced |
| 3.17 | `tag.list` — Lists tags for a project | ✅ Done | Includes task usage count |
| 3.18 | `tag.update` — Updates tag name/color | ✅ Done | Uniqueness check on rename |
| 3.19 | `tag.delete` — Deletes tag | ✅ Done | Cascade removes TaskTag |
| 3.20 | `tag.addToTask` — Associates tag with task | ✅ Done | Validates tag belongs to same project |
| 3.21 | `tag.removeFromTask` — Removes tag from task | ✅ Done | Membership verified |

### Auth Router (tRPC)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.22 | `auth.getProfile` — Returns current user profile | ✅ Done | Excludes password field via select |
| 3.23 | `auth.updateProfile` — Updates name, image | ✅ Done | Partial update supported |

### Root Router

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.24 | All routers merged in `root.ts` | ✅ Done | project, task, tag, auth, dashboard; postRouter removed |

---

## Phase 4: UI/UX Implementation

### Layout & Navigation

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.1 | `AppLayout` with sidebar navigation exists | ✅ Done | `src/components/layout/AppLayout.tsx` wraps protected pages with responsive shell |
| 4.2 | `Sidebar` with project list and quick navigation | ✅ Done | Sidebar loads project list and links to dashboard, projects, profile, and new project |
| 4.3 | `Header` with user avatar, dropdown, logout | ✅ Done | Header shows current user identity and sign-out action |

### Project Pages

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.4 | Projects list page (`/projects`) — grid of project cards | ✅ Done | Shows project cards with task/member counts and updated date |
| 4.5 | New project page (`/projects/new`) — create form | ✅ Done | Creates project and redirects to project board |
| 4.6 | Project detail page (`/projects/[id]`) — task board (Kanban) | ✅ Done | Includes filters, status counts, create-task modal, native drag/drop, and status select fallback |
| 4.7 | Project settings page (`/projects/[id]/settings`) — member management | ✅ Done | Supports project edit, delete, members, roles, and tag management |

### Task Components

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.8 | `TaskBoard` — Kanban columns (TODO, IN_PROGRESS, IN_REVIEW, DONE) | ✅ Done | Groups tasks by status and updates status via native drag/drop |
| 4.9 | `TaskCard` — Summary with title, assignee, priority, tags, deadline | ✅ Done | Shows badges, avatar/assignee, deadline, and link to detail page |
| 4.10 | `TaskForm` — Create/edit form with all fields | ✅ Done | Supports title, description, status, priority, deadline, assignee, and tags |
| 4.11 | `TaskDetail` — Full detail view page | ✅ Done | `/projects/[id]/tasks/[taskId]` supports view, edit, and delete |

### Profile Page

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.12 | User profile page (`/profile`) — edit name, email, image | ✅ Done | Name and image URL editable; email is read-only |

### Dashboard (Optional)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.13 | Dashboard page (`/dashboard`) with stats | ✅ Done | Full dashboard page implemented and protected |
| 4.14 | Task count by status (stats cards) | ✅ Done | Backed by `dashboard.getStats` |
| 4.15 | Upcoming deadlines timeline | ✅ Done | Backed by `dashboard.getUpcomingDeadlines` |
| 4.16 | Recent activity feed | ✅ Done | Backed by `dashboard.getRecentActivity`; dashboard also shows `dashboard.getMyTasks` |

---

## Phase 5: Unit Tests (Code)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Test framework (Vitest) installed and configured | ✅ Done | `vitest.config.ts`, `src/test/setup.ts`, and npm `test` scripts added |
| 5.2 | Test: Password hashing produces valid bcrypt hash | ✅ Done | `src/server/auth/password.test.ts` verifies bcrypt hash format and comparison |
| 5.3 | Test: Password comparison succeeds with correct password | ✅ Done | Covered by `verifyPassword()` unit test |
| 5.4 | Test: Password comparison fails with wrong password | ✅ Done | Covered by `verifyPassword()` unit test |
| 5.5 | Test: Signup validation rejects invalid email | ✅ Done | `src/server/auth/signup.test.ts` covers invalid email validation |
| 5.6 | Test: Signup validation rejects short password (< 6 chars) | ✅ Done | `src/server/auth/signup.test.ts` covers password minimum length |
| 5.7 | Test: Signup validation accepts valid input | ✅ Done | `src/server/auth/signup.test.ts` covers valid payload parsing |
| 5.8 | Test: Task CRUD operations work correctly | ✅ Done | `src/server/api/routers/task.test.ts` covers create, list, update, delete |
| 5.9 | Test: Project CRUD operations work correctly | ✅ Done | `src/server/api/routers/project.test.ts` covers create, list, update, delete |
| 5.10 | Test: Non-member cannot access project tasks | ✅ Done | `src/server/api/routers/task.test.ts` verifies FORBIDDEN for non-member task list access |

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
| 7.6 | ESLint passes with no warnings | ✅ Done | Verified with `npm run lint` after Phase 4 implementation |
| 7.7 | TypeScript strict checks pass | ✅ Done | Verified with `npm run build` and `tsc --noEmit` |
| 7.8 | No unused code or console.logs | ❌ Not Done | |

---

## Summary

| Phase | Total | Done | Remaining |
|-------|-------|------|-----------|
| Phase 1: Setup & Foundation | 14 | 13 | 1 |
| Phase 2: Authentication | 25 | 25 | 0 |
| Phase 3: Core Features (API) | 24 | 24 | 0 |
| Phase 4: UI/UX | 16 | 16 | 0 |
| Phase 5: Unit Tests | 10 | 10 | 0 |
| Phase 6: Deployment | 4 | 0 | 4 |
| Phase 7: Documentation | 8 | 7 | 1 |
| **Total** | **101** | **95** | **6** |
