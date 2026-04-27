# Task Management & Collaboration Tool

A full-stack task management and collaboration app built with the T3 Stack. Teams can create projects, manage members, organize tasks on a Kanban board, assign work, set priorities and deadlines, and use project-scoped tags.

## Tech Stack

- **Framework:** Next.js 14, Pages Router
- **Language:** TypeScript, strict mode
- **Node.js:** >= 20.x (24.x LTS recommended)
- **Styling:** Tailwind CSS
- **API:** tRPC v11 with SuperJSON
- **Auth:** NextAuth.js v4, Credentials provider
- **ORM:** Prisma v5
- **Database:** PostgreSQL
- **Package Manager:** npm with exact dependency versions
- **CI/CD:** GitHub Actions with AWS OIDC

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

- Node.js >= 20.x (24.x LTS recommended)
- npm >= 10.x
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

## Commands Reference

Here are all the `npm`, `npx`, and script commands needed to develop, test, and deploy this project.

### npm Scripts

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests once |
| `npm run test:watch` | Run Vitest unit tests in watch mode |
| `npm run db:generate` | Run Prisma migrate dev |
| `npm run db:migrate` | Deploy Prisma migrations |
| `npm run db:push` | Push Prisma schema without migration |
| `npm run db:studio` | Open Prisma Studio |

### npx Commands

| Command | Description |
|---|---|
| `npx prisma generate` | Generate Prisma Client (runs automatically on postinstall) |
| `npx sst deploy --stage production` | Deploy the application to AWS using SST |
| `npx sst remove --stage production` | Remove the deployed application from AWS |
| `npx sst secret set <key> "<value>" --stage production` | Set SST secrets for the production environment |

### Bash Commands

| Command | Description |
|---|---|
| `./start-database.sh` | Start local PostgreSQL using Docker |

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
| Phase 5: Unit Tests | Complete |
| Phase 6: Deployment | Complete |
| Phase 7: Documentation & Polish | Complete |

## Verification

The final implementation has been verified with:

```bash
npm run lint
npm run build
npm run test
```

## CI/CD

This project uses **GitHub Actions** for automated testing and deployment.

### GitHub Actions Workflow

The workflow is defined in `.github/workflows/deploy.yml`. It triggers on pushes to the `main` branch and performs the following:
1.  Checks out the code.
2.  Sets up Node.js 24.
3.  Configures AWS credentials using **OpenID Connect (OIDC)**.
4.  Installs dependencies.
5.  Runs linting (`npm run lint`).
6.  Runs unit tests (`npm run test`).
7.  Deploys to AWS via SST (`npx sst deploy --stage production`).

### Security with OIDC

We use AWS OIDC to avoid storing long-lived AWS Access Keys in GitHub. The workflow assumes a specific IAM Role in AWS that is cryptographically trusted by GitHub.

**Required GitHub Secrets:**
- `AWS_OIDC_ROLE_ARN`: The ARN of the IAM Role for deployment.

## Deployment

This application is deployed to AWS using **SST v3 (Ion)**. While deployment is automated via CI/CD, manual deployment is still possible.

### Deployment Commands

1. **Configure OIDC Role**
   Follow the steps in the AWS Console to create an OIDC Identity Provider and a Role with the `SST-Managed-Deploy-Policy`.

2. **Set Secrets** (Production)
   SST secrets are stored in AWS SSM. Set them once from your local machine:
   ```bash
   npx sst secret set DATABASE_URL "your-pooled-supabase-url" --stage production
   npx sst secret set NEXTAUTH_SECRET "your-nextauth-secret" --stage production
   npx sst secret set NEXTAUTH_URL "https://your-cloudfront-url.cloudfront.net" --stage production
   ```

3. **Deploy**
   Push to the `main` branch to trigger the GitHub Actions pipeline.

4. **Manual Deploy** (Optional)
   ```bash
   npx sst deploy --stage production
   ```

5. **Teardown** (if needed)
   ```bash
   npx sst remove --stage production
   ```
