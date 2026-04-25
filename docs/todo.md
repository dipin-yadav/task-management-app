# TODO — Task Management & Collaboration Tool

## Phase 1: Project Setup & Foundation
- [ ] Scaffold T3 app with `npm create t3-app@7.37.0` (TypeScript, Tailwind, tRPC, NextAuth, Prisma, Pages Router, PostgreSQL)
- [ ] Initialize git repo and create `.gitignore`
- [ ] Create Supabase project and obtain connection strings
- [ ] Configure `.env` with `DATABASE_URL` (pooled, port 6543) and `DIRECT_URL` (direct, port 5432)
- [ ] Update `prisma/schema.prisma` — add `password` to `User` model
- [ ] Add `Project`, `ProjectMember`, `Task`, `Tag`, `TaskTag` models to Prisma schema
- [ ] Run `npx prisma migrate dev --name init` to create initial migration
- [ ] Verify Prisma schema in Supabase dashboard
- [ ] Initialize SST with `npx sst@latest init`
- [ ] Configure `sst.config.ts` with `sst.aws.Nextjs` and environment variables
- [ ] Customize `tailwind.config.ts` with project color palette
- [ ] Verify app builds and runs locally with `npm run dev`

## Phase 2: Authentication
- [ ] Configure NextAuth Credentials provider in `src/server/auth.ts`
- [ ] Set session strategy to `jwt`
- [ ] Configure Prisma Adapter for NextAuth
- [ ] Add session callbacks to include `user.id` in session
- [ ] Install `bcryptjs` and `@types/bcryptjs`
- [ ] Create custom signup API route: `src/pages/api/auth/signup.ts`
  - [ ] Validate email format and password strength
  - [ ] Hash password with bcryptjs
  - [ ] Create user via Prisma
  - [ ] Return appropriate response
- [ ] Build signup page: `src/pages/auth/signup.tsx`
  - [ ] Email, password, confirm password, name fields
  - [ ] Client-side validation
  - [ ] Error handling and display
  - [ ] Redirect to signin on success
- [ ] Build login page: `src/pages/auth/signin.tsx`
  - [ ] Email and password fields
  - [ ] Error handling for invalid credentials
  - [ ] Link to signup page
- [ ] Implement `authorize` function in Credentials provider
- [ ] Set up `getServerSideProps` helper for protected pages
- [ ] Add auth redirect logic (unauthenticated → `/auth/signin`)
- [ ] Test signup → login → session flow end-to-end

## Phase 3: Core Features — tRPC Routers
### Project Router (`src/server/api/routers/project.ts`)
- [ ] `project.create` — Create project, owner auto-added as OWNER
- [ ] `project.list` — List user's projects
- [ ] `project.getById` — Get project details + members
- [ ] `project.update` — Update name/description (OWNER/ADMIN)
- [ ] `project.delete` — Delete project cascade (OWNER only)
- [ ] `project.addMember` — Add member by email
- [ ] `project.removeMember` — Remove member
- [ ] `project.updateMemberRole` — Change role (OWNER only)

### Task Router (`src/server/api/routers/task.ts`)
- [ ] `task.create` — Create task in a project
- [ ] `task.list` — List tasks with filters (status, priority, assignee, tags)
- [ ] `task.getById` — Get task details with tags and assignee
- [ ] `task.update` — Update task fields
- [ ] `task.delete` — Delete task
- [ ] `task.assign` — Assign/reassign task
- [ ] `task.updateStatus` — Quick status update

### Tag Router (`src/server/api/routers/tag.ts`)
- [ ] `tag.create` — Create tag in project
- [ ] `tag.list` — List project tags
- [ ] `tag.update` — Update tag name/color
- [ ] `tag.delete` — Delete tag
- [ ] `tag.addToTask` — Associate tag with task
- [ ] `tag.removeFromTask` — Remove tag from task

### Auth Router (`src/server/api/routers/auth.ts`)
- [ ] `auth.getProfile` — Get current user profile
- [ ] `auth.updateProfile` — Update name, image

### Dashboard Router (`src/server/api/routers/dashboard.ts`) — Optional
- [ ] `dashboard.getStats` — Task counts by status
- [ ] `dashboard.getUpcomingDeadlines` — Tasks due soon
- [ ] `dashboard.getRecentActivity` — Recently updated tasks

### Root Router
- [ ] Merge all routers in `src/server/api/root.ts`

## Phase 4: UI/UX Implementation
### Layout & Navigation
- [ ] Build `AppLayout` component (sidebar + main content)
- [ ] Build `Sidebar` component (navigation links, project list)
- [ ] Build `Header` component (user avatar, dropdown, logout)
- [ ] Set up consistent page wrapper in `_app.tsx`

### Auth Pages
- [ ] Polish signup page with proper styling
- [ ] Polish login page with proper styling
- [ ] Add loading states and error feedback

### Project Pages
- [ ] Projects list page (`/projects`) — grid of project cards
- [ ] New project page (`/projects/new`) — create form
- [ ] Project detail page (`/projects/[id]`) — task board (Kanban)
- [ ] Project settings page (`/projects/[id]/settings`) — manage members

### Task Components
- [ ] `TaskBoard` — Kanban columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- [ ] `TaskCard` — Summary card with title, assignee, priority, tags, deadline
- [ ] `TaskForm` — Create/edit form with all fields
- [ ] `TaskDetail` — Full detail view page (`/projects/[id]/tasks/[taskId]`)
- [ ] `TaskFilters` — Filter bar (status, priority, assignee, tags)
- [ ] Drag-and-drop status updates (nice-to-have)

### Tag Components
- [ ] `TagBadge` — Colored badge component
- [ ] `TagPicker` — Multi-select tag picker for task form

### Profile Page
- [ ] User profile page (`/profile`) — edit name, email, image
- [ ] `ProfileForm` component

### Dashboard (Optional)
- [ ] Dashboard page (`/dashboard`)
- [ ] `StatsCards` — task count summary cards
- [ ] `DeadlineTimeline` — upcoming deadlines list
- [ ] `RecentActivity` — recent task updates

### Reusable UI Components
- [ ] `Button` component
- [ ] `Input` component
- [ ] `Select` component
- [ ] `Modal` component
- [ ] `DatePicker` component
- [ ] `Avatar` component

## Phase 5: Testing
- [ ] Install and configure Vitest (or Jest)
- [ ] Set up test utilities and Prisma mocks
- [ ] Write auth tests:
  - [ ] Password hashing/comparison
  - [ ] Signup validation (email format, password strength)
  - [ ] Login with valid/invalid credentials
- [ ] Write tRPC router tests:
  - [ ] Task CRUD operations
  - [ ] Project CRUD operations
  - [ ] Authorization checks (non-member cannot access)
- [ ] Write utility function tests
- [ ] Run all tests and verify passing

## Phase 6: Deployment
- [ ] Configure AWS credentials
- [ ] Ensure IAM permissions for SST deployment
- [ ] Run `sst deploy --stage staging` and verify
- [ ] Test all features on staging URL
- [ ] Run `sst deploy --stage production`
- [ ] Set `NEXTAUTH_URL` to production CloudFront domain
- [ ] Verify production deployment end-to-end

## Phase 7: Documentation & Polish
- [ ] Write comprehensive `README.md`
  - [ ] Project overview
  - [ ] Tech stack summary
  - [ ] Local development setup instructions
  - [ ] Environment variables guide
  - [ ] Supabase setup instructions
  - [ ] SST / AWS deployment instructions
  - [ ] Testing instructions
  - [ ] Architecture overview
- [ ] Run ESLint and fix all warnings
- [ ] Run TypeScript strict checks
- [ ] Remove unused code, console.logs, TODOs
- [ ] Test all user flows end-to-end
- [ ] Verify responsive design on mobile/tablet
- [ ] Check error handling and edge cases
- [ ] Push to GitHub
- [ ] Share repository link
