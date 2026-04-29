# Database Schema — Task Management & Collaboration Tool

This document describes the Prisma schema for the application's database, hosted on Supabase (PostgreSQL).

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ──────────────────────────────────
// NextAuth.js required models
// ──────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ──────────────────────────────────
// Application models
// ──────────────────────────────────

model User {
  id            String          @id @default(cuid())
  name          String?
  email         String?         @unique
  emailVerified DateTime?
  image         String?
  password      String?         // Hashed password for Credentials provider

  accounts      Account[]
  sessions      Session[]

  // Application relations
  ownedProjects   Project[]       @relation("ProjectOwner")
  memberships     ProjectMember[]
  createdTasks    Task[]          @relation("TaskCreator")
  assignedTasks   Task[]          @relation("TaskAssignee")

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum ProjectRole {
  OWNER
  ADMIN
  MEMBER
}

model Project {
  id          String          @id @default(cuid())
  name        String
  description String?

  ownerId     String
  owner       User            @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  members     ProjectMember[]
  tasks       Task[]
  tags        Tag[]

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model ProjectMember {
  id        String      @id @default(cuid())
  role      ProjectRole @default(MEMBER)

  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  joinedAt  DateTime    @default(now())

  @@unique([projectId, userId])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  deadline    DateTime?

  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  creatorId   String
  creator     User         @relation("TaskCreator", fields: [creatorId], references: [id])

  assigneeId  String?
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id])

  tags        TaskTag[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
  @@index([priority])
}

model Tag {
  id        String    @id @default(cuid())
  name      String
  color     String    @default("#6366f1") // Default indigo

  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  tasks     TaskTag[]

  @@unique([name, projectId])
}

model TaskTag {
  taskId String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)

  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
}
```

---

## Schema Notes

### User Model
- Extends the standard NextAuth `User` model with a `password` field for the Credentials provider.
- `password` is nullable (`String?`) to maintain compatibility with potential future OAuth providers.
- Related to projects (as owner), memberships, and tasks (as creator and assignee).

### Project & ProjectMember
- Each project has a single owner and multiple members via the `ProjectMember` join table.
- `ProjectRole` enum: `OWNER`, `ADMIN`, `MEMBER` — controls permissions at the project level.
- `@@unique([projectId, userId])` prevents duplicate memberships.

### Task
- Belongs to a project; has a creator and an optional assignee.
- `TaskStatus` enum for Kanban columns: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`.
- `TaskPriority` enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Indexed on `projectId`, `assigneeId`, `status`, and `priority` for query performance.

### Tag & TaskTag
- Tags are project-scoped: `@@unique([name, projectId])`.
- `TaskTag` is a many-to-many join table with a composite primary key.
- Cascade deletes: deleting a project removes all its tags, deleting a tag removes its task associations.

### Supabase Connection Configuration

```env
# .env

# Use the dedicated prisma role with the connection pooler for app runtime
DATABASE_URL="postgresql://prisma.[PROJECT_REF]:[PRISMA_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Use the dedicated prisma role with direct/session mode for migrations only
DIRECT_URL="postgresql://prisma.[PROJECT_REF]:[PRISMA_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Supabase RLS Posture

All application tables in `public` have RLS enabled by migration. No permissive RLS policies are defined, so Supabase Data API requests using `anon` or `authenticated` cannot directly read or mutate app rows. Server-side Prisma uses a trusted database role and app authorization remains in tRPC.

For dashboard hardening, Prisma role setup, credential rotation, and Security Advisor verification, see [Supabase Security Hardening](./supabase-security.md).

### Migration Commands

```bash
# Create and apply a migration
npx prisma migrate dev --name <migration_name>

# Generate Prisma Client
npx prisma generate

# Push schema changes without creating a migration (dev only)
npx prisma db push

# Open Prisma Studio to browse data
npx prisma studio

# Reset database (WARNING: destructive)
npx prisma migrate reset
```
