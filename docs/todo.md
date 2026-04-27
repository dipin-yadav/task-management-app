# TODO — Task Management & Collaboration Tool

## Phase 1: Project Setup & Foundation
- [x] Scaffold T3 app with `npm create t3-app@7.37.0` (TypeScript, Tailwind, tRPC, NextAuth, Prisma, Pages Router, PostgreSQL)
- [x] Initialize git repo and create `.gitignore`
- [x] Create Supabase project and obtain connection strings
- [x] Configure `.env` with `DATABASE_URL` (pooled, port 6543) and `DIRECT_URL` (direct, port 5432)
- [x] Update `prisma/schema.prisma` — add `password` to `User` model
- [x] Add `Project`, `ProjectMember`, `Task`, `Tag`, `TaskTag` models to Prisma schema
- [x] Run `npx prisma migrate dev --name init` to create initial migration
- [x] Verify Prisma schema in Supabase dashboard
- [x] Initialize SST with `npx sst@latest init`
- [x] Configure `sst.config.ts` with `sst.aws.Nextjs` and environment variables
- [x] Customize `tailwind.config.ts` with project color palette
- [x] Verify app builds and runs locally with `npm run dev`

## Phase 2: Authentication
- [x] Configure NextAuth Credentials provider in `src/server/auth.ts`
- [x] Set session strategy to `jwt`
- [x] Configure Prisma Adapter for NextAuth
- [x] Add session callbacks to include `user.id` in session
- [x] Install `bcryptjs` and `@types/bcryptjs`
- [x] Create custom signup API route: `src/pages/api/auth/signup.ts`
  - [x] Validate email format and password strength
  - [x] Hash password with bcryptjs
  - [x] Create user via Prisma
  - [x] Return appropriate response
- [x] Build signup page: `src/pages/auth/signup.tsx`
  - [x] Email, password, confirm password, name fields
  - [x] Client-side validation
  - [x] Error handling and display
  - [x] Redirect to signin on success
- [x] Build login page: `src/pages/auth/signin.tsx`
  - [x] Email and password fields
  - [x] Error handling for invalid credentials
  - [x] Link to signup page
- [x] Implement `authorize` function in Credentials provider
- [x] Set up `getServerSideProps` helper for protected pages
- [x] Add auth redirect logic (unauthenticated → `/auth/signin`)
- [x] Test signup → login → session flow end-to-end

## Phase 3: Core Features — tRPC Routers
### Project Router (`src/server/api/routers/project.ts`)
- [x] `project.create` — Create project, owner auto-added as OWNER
- [x] `project.list` — List user's projects
- [x] `project.getById` — Get project details + members
- [x] `project.update` — Update name/description (OWNER/ADMIN)
- [x] `project.delete` — Delete project cascade (OWNER only)
- [x] `project.addMember` — Add member by email
- [x] `project.removeMember` — Remove member
- [x] `project.updateMemberRole` — Change role (OWNER only)

### Task Router (`src/server/api/routers/task.ts`)
- [x] `task.create` — Create task in a project
- [x] `task.list` — List tasks with filters (status, priority, assignee, tags)
- [x] `task.getById` — Get task details with tags and assignee
- [x] `task.update` — Update task fields
- [x] `task.delete` — Delete task
- [x] `task.assign` — Assign/reassign task
- [x] `task.updateStatus` — Quick status update

### Tag Router (`src/server/api/routers/tag.ts`)
- [x] `tag.create` — Create tag in project
- [x] `tag.list` — List project tags
- [x] `tag.update` — Update tag name/color
- [x] `tag.delete` — Delete tag
- [x] `tag.addToTask` — Associate tag with task
- [x] `tag.removeFromTask` — Remove tag from task

### Auth Router (`src/server/api/routers/auth.ts`)
- [x] `auth.getProfile` — Get current user profile
- [x] `auth.updateProfile` — Update name, image

### Dashboard Router (`src/server/api/routers/dashboard.ts`) — Optional
- [x] `dashboard.getStats` — Task counts by status
- [x] `dashboard.getUpcomingDeadlines` — Tasks due soon
- [x] `dashboard.getRecentActivity` — Recently updated tasks

### Root Router
- [x] Merge all routers in `src/server/api/root.ts`

## Phase 4: UI/UX Implementation
### Layout & Navigation
- [x] Build `AppLayout` component (sidebar + main content)
- [x] Build `Sidebar` component (navigation links, project list)
- [x] Build `Header` component (user avatar, dropdown, logout)
- [x] Set up consistent page wrapper in `_app.tsx`

### Auth Pages
- [x] Polish signup page with proper styling
- [x] Polish login page with proper styling
- [x] Add loading states and error feedback

### Project Pages
- [x] Projects list page (`/projects`) — grid of project cards
- [x] New project page (`/projects/new`) — create form
- [x] Project detail page (`/projects/[id]`) — task board (Kanban)
- [x] Project settings page (`/projects/[id]/settings`) — manage members

### Task Components
- [x] `TaskBoard` — Kanban columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- [x] `TaskCard` — Summary card with title, assignee, priority, tags, deadline
- [x] `TaskForm` — Create/edit form with all fields
- [x] `TaskDetail` — Full detail view page (`/projects/[id]/tasks/[taskId]`)
- [x] `TaskFilters` — Filter bar (status, priority, assignee, tags)
- [x] Drag-and-drop status updates (nice-to-have)

### Tag Components
- [x] `TagBadge` — Colored badge component
- [x] `TagPicker` — Multi-select tag picker for task form

### Profile Page
- [x] User profile page (`/profile`) — edit name, email, image
- [x] `ProfileForm` component

### Dashboard (Optional)
- [x] Dashboard page (`/dashboard`)
- [x] `StatsCards` — task count summary cards
- [x] `DeadlineTimeline` — upcoming deadlines list
- [x] `RecentActivity` — recent task updates

### Reusable UI Components
- [x] `Button` component
- [x] `Input` component
- [x] `Select` component
- [x] `Modal` component
- [x] `DatePicker` component
- [x] `Avatar` component

## Phase 5: Testing
- [x] Install and configure Vitest (or Jest)
- [x] Set up test utilities and Prisma mocks
- [x] Write auth tests:
  - [x] Password hashing/comparison
  - [x] Signup validation (email format, password strength)
  - [x] Login with valid/invalid credentials
- [x] Write tRPC router tests:
  - [x] Task CRUD operations
  - [x] Project CRUD operations
  - [x] Authorization checks (non-member cannot access)
- [x] Write utility function tests
- [x] Run all tests and verify passing

## Phase 6: Deployment
- [x] Configure AWS credentials
- [x] Ensure IAM permissions for SST deployment
- [x] Run `sst deploy --stage staging` and verify
- [x] Test all features on staging URL
- [x] Run `sst deploy --stage production`
- [x] Set `NEXTAUTH_URL` to production CloudFront domain
- [x] Verify production deployment end-to-end

## Phase 7: Documentation & Polish
- [x] Write comprehensive `README.md`
  - [x] Project overview
  - [x] Tech stack summary
  - [x] Local development setup instructions
  - [x] Environment variables guide
  - [x] Supabase setup instructions
  - [x] SST / AWS deployment instructions
  - [x] Testing instructions
  - [x] Architecture overview
- [x] Run ESLint and fix all warnings
- [x] Run TypeScript strict checks
- [ ] Remove unused code, console.logs, TODOs
- [ ] Test all user flows end-to-end
- [ ] Verify responsive design on mobile/tablet
- [ ] Check error handling and edge cases
- [ ] Push to GitHub
- [ ] Share repository link
