# Task Management & Collaboration Tool

A premium, serverless Task Management application built with the **T3 Stack**. This project enables team collaboration through intuitive task tracking, project management, and user profiles.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (Pages Router)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Database ORM**: [Prisma](https://prisma.io)
- **API**: [tRPC](https://trpc.io)
- **Database**: [PostgreSQL](https://www.postgresql.org) (Local / Supabase)
- **Infrastructure**: [SST (Serverless Stack)](https://sst.dev) for AWS deployment

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

# Optional: Discord Auth
# DISCORD_CLIENT_ID=""
# DISCORD_CLIENT_SECRET=""
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

- `docs/`: Comprehensive project documentation (Architecture, Schema, Setup).
- `prisma/`: Database schema and migration history.
- `src/components/`: Reusable React components.
- `src/pages/`: Next.js pages and API routes.
- `src/server/`: Backend logic (tRPC routers, auth configuration, database client).
- `sst.config.ts`: Infrastructure-as-code for AWS deployment.

## ☁️ Deployment

This project is designed to be deployed on **AWS** using **SST**.

1. Configure AWS CLI with your credentials.
2. Update the `DATABASE_URL` to point to your **Supabase** instance.
3. Run `npx sst deploy --stage production`.

Refer to `docs/setup-guide.md` for detailed deployment instructions.

---

## 📄 License

This project is licensed under the MIT License.
