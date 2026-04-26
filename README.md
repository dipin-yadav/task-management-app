# Task Management & Collaboration Tool

A premium, serverless Task Management application built with the **T3 Stack**. This project enables team collaboration through intuitive task tracking, project management, and user profiles.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (Pages Router)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Authentication**: [NextAuth.js](https://next-auth.js.org) (Credentials provider — email/password)
- **Database ORM**: [Prisma](https://prisma.io)
- **API**: [tRPC](https://trpc.io)
- **Database**: [PostgreSQL](https://www.postgresql.org) (Locally installed)

## 🛠️ Local Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

- **Node.js** >= 18.x
- **Docker** (optional, for local database container)
- **npm** >= 9.x

### 1. Clone & Install

```bash
git clone <repository-url>
cd task-management-app
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and populate it:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/task-management-app"
DIRECT_URL="postgresql://postgres:password@localhost:5432/task-management-app"

# Next Auth
NEXTAUTH_SECRET="your-secret-here" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Database

If you have Docker installed, use the provided script to spin up a PostgreSQL instance:

```bash
chmod +x start-database.sh
./start-database.sh
```

### 4. Database Migrations

Apply the Prisma schema to your local database:

```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

- `docs/` — Project documentation (architecture, schema, API reference, setup guide)
- `prisma/` — Database schema and migration history
- `src/pages/` — Next.js pages and API routes
- `src/pages/auth/` — Sign-in and sign-up pages
- `src/server/api/routers/` — tRPC routers (project, task, tag, auth)
- `src/server/auth.ts` — NextAuth.js configuration (Credentials provider)
- `src/server/db.ts` — Prisma client singleton

## 🔌 API Overview (tRPC)

All API endpoints are type-safe tRPC procedures. See `docs/api-reference.md` for full details.

| Router | Procedures | Description |
|--------|-----------|-------------|
| `project` | 8 | CRUD + member management with role-based auth (OWNER/ADMIN/MEMBER) |
| `task` | 7 | CRUD + assign + status update + filtering/search |
| `tag` | 6 | CRUD + task association |
| `auth` | 2 | Profile get/update |

## 📊 Progress

| Phase | Status |
|-------|--------|
| Phase 1: Setup & Foundation | ✅ Done |
| Phase 2: Authentication | ✅ Done |
| Phase 3: Core Features (API) | ✅ Done |
| Phase 4: UI/UX | 🔲 Not started |
| Phase 5: Unit Tests | 🔲 Not started |
| Phase 6: Deployment | 🔲 Not started |
| Phase 7: Documentation & Polish | 🔲 In progress |

## ☁️ Deployment

Deployment to AWS via SST is planned for a later phase. The app currently runs locally with a locally installed PostgreSQL instance.

---

## 📄 License

This project is licensed under the MIT License.
