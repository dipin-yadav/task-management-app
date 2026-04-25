# Environment & Setup Guide

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **AWS CLI** configured with valid credentials
- **Supabase account** (free tier works for development)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **New Project**
3. Choose organization, name, and database password
4. Wait for the project to be provisioned
5. Go to **Project Settings → Database** to get connection strings

### Connection Strings

| Variable | Where to Find | Port | Notes |
|---|---|---|---|
| `DATABASE_URL` | Settings → Database → Connection string → URI (Transaction mode) | `6543` | Use for app runtime |
| `DIRECT_URL` | Settings → Database → Connection string → URI (Session mode) | `5432` | Use for Prisma migrations |

---

## 2. Environment Variables

Create a `.env` file in the project root:

```env
# ─── Supabase (PostgreSQL) ───
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ─── NextAuth.js ───
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# ─── Node Environment ───
NODE_ENV="development"
```

### Generate `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

---

## 3. AWS Configuration (for SST Deployment)

### Install AWS CLI

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure Credentials

```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region name: us-east-1 (or your preferred region)
# Default output format: json
```

### Required IAM Permissions

The IAM user/role needs permissions for:
- **CloudFormation** (stack management)
- **Lambda** (function deployment)
- **S3** (static assets)
- **CloudFront** (CDN distribution)
- **IAM** (role creation for Lambda)
- **API Gateway** (if used)

> **Tip:** For development, `AdministratorAccess` policy works. For production, create a more restrictive policy.

---

## 4. SST Configuration

### Install SST

SST is initialized as part of the project, no global install needed.

```bash
npx sst@latest init
```

### SST Secrets (Production)

Instead of `.env` files in production, use SST secrets:

```bash
# Set secrets for a specific stage
npx sst secret set DATABASE_URL "postgresql://..." --stage production
npx sst secret set NEXTAUTH_SECRET "your-secret" --stage production
npx sst secret set NEXTAUTH_URL "https://your-domain.com" --stage production
```

---

## 5. Local Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Generate Prisma Client
npx prisma generate

# 5. Start development server
npm run dev

# 6. (Optional) Start SST dev mode for AWS integration
npx sst dev
```

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npx prisma studio` | Open Prisma Studio (DB browser) |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma db push` | Push schema without migration |
| `npx sst dev` | Start SST dev mode |
| `npx sst deploy --stage staging` | Deploy to staging |
| `npx sst deploy --stage production` | Deploy to production |
| `npx sst remove --stage staging` | Tear down staging |
| `npm run lint` | Run ESLint |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |

---

## 6. Deployment Checklist

Before deploying:

- [ ] All environment variables are set (SST secrets or `.env`)
- [ ] Database migrations are applied to Supabase
- [ ] AWS credentials are configured
- [ ] `NEXTAUTH_URL` points to the production domain
- [ ] Build succeeds locally (`npm run build`)
- [ ] Tests pass (`npm test`)

### Deploy Commands

```bash
# Deploy to staging
npx sst deploy --stage staging

# Verify staging
# Visit the CloudFront URL output by SST

# Deploy to production
npx sst deploy --stage production
```

---

## 7. Project Structure (After Setup)

```
task-management-app/
├── docs/                     # This documentation folder
│   ├── architecture.md
│   ├── plan.md
│   ├── todo.md
│   ├── database-schema.md
│   ├── api-reference.md
│   └── setup-guide.md
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration history
├── src/
│   ├── components/           # React components
│   ├── pages/                # Next.js pages (Pages Router)
│   │   ├── api/              # API routes (tRPC, NextAuth, signup)
│   │   ├── auth/             # Auth pages (signin, signup)
│   │   ├── dashboard/        # Dashboard page
│   │   ├── projects/         # Project pages
│   │   └── profile/          # Profile page
│   ├── server/               # Server-side code
│   │   ├── api/              # tRPC routers
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── db.ts             # Prisma client
│   ├── styles/               # Global styles
│   └── utils/                # Utilities (tRPC client, helpers)
├── sst.config.ts             # SST infrastructure config
├── tailwind.config.ts        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
├── package.json
├── .env                      # Environment variables (not committed)
├── .env.example              # Template for env vars
└── README.md                 # Project README
```
