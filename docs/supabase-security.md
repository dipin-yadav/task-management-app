# Supabase Security Hardening

This app uses Supabase as hosted PostgreSQL only. It does not use Supabase Auth, browser-side Supabase clients, Realtime, GraphQL, or direct REST access for application data. Authorization remains in NextAuth and tRPC.

## Applied Database Guard

The migration `20260429120000_enable_rls_on_public_tables` enables Row-Level Security on every app table in the `public` schema:

- `Account`
- `Session`
- `VerificationToken`
- `User`
- `Project`
- `ProjectMember`
- `Task`
- `Tag`
- `TaskTag`

No permissive RLS policies are created. This is intentional: with RLS enabled and no policies, Supabase Data API requests made as `anon` or `authenticated` cannot read or mutate rows in these tables. Server-side Prisma access must use a trusted database role.

## Supabase Dashboard Hardening

In Supabase Dashboard for the production project:

1. Go to **Project Settings -> API**.
2. Under Data API settings, remove `public` from exposed schemas if the project does not need Supabase REST access.
3. Keep `public` unexposed unless a future feature intentionally uses Supabase Data API with explicit RLS policies.
4. Re-run Security Advisor after migrations are deployed.

Expected advisor result:

- No `rls_disabled_in_public` findings for application tables.
- No `sensitive_columns_exposed` findings for `User.password` or other app columns.

## Dedicated Prisma Role

Create a dedicated database role for Prisma instead of using broad default credentials in deployed app secrets. Use a generated password and keep it out of source control.

```sql
create user "prisma" with password '<generated-password>' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Use the `prisma` role in both connection strings:

```env
DATABASE_URL="postgresql://prisma.[PROJECT_REF]:[PRISMA_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://prisma.[PROJECT_REF]:[PRISMA_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

For SST production secrets:

```bash
npx sst secret set DATABASE_URL "postgresql://prisma.[PROJECT_REF]:[PRISMA_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true" --stage production
```

`DIRECT_URL` is used by Prisma migrations and should be present in local or CI migration environments. The deployed Next.js runtime currently only receives `DATABASE_URL`.

GitHub Actions runs `npm run db:migrate`, syncs SST runtime secrets, then runs `npx sst deploy --stage production`. Add these repository secrets under **Settings -> Secrets and variables -> Actions**:

- `PRODUCTION_DATABASE_URL`: pooled transaction URL for the `prisma` role on port `6543`.
- `PRODUCTION_DIRECT_URL`: session/direct migration URL for the `prisma` role on port `5432`.
- `PRODUCTION_NEXTAUTH_SECRET`: production NextAuth JWT signing secret.
- `PRODUCTION_NEXTAUTH_URL`: production public app URL used by NextAuth callbacks.

`PRODUCTION_DATABASE_URL` is used twice in CI: first by Prisma migrations, then to update the SST `DATABASE_URL` secret consumed by the deployed Next.js runtime. `PRODUCTION_NEXTAUTH_SECRET` and `PRODUCTION_NEXTAUTH_URL` are synced to their matching SST runtime secrets. `PRODUCTION_DIRECT_URL` is migration-only and is not passed to the deployed Next.js runtime.

For local production deploys, use:

```bash
npm run deploy:production
```

This runs `prisma migrate deploy` first and only runs `sst deploy --stage production` if migrations succeed. The migration uses the `DATABASE_URL` and `DIRECT_URL` available in the local shell or `.env`.

Local `sst deploy` reads runtime secrets from the SST secret store, not from `.env`. Set or refresh them before local deployment:

```bash
npx sst secret set DATABASE_URL "$DATABASE_URL" --stage production
npx sst secret set NEXTAUTH_SECRET "$NEXTAUTH_SECRET" --stage production
npx sst secret set NEXTAUTH_URL "$NEXTAUTH_URL" --stage production
```

## Credential Rotation And Review

After deploying the RLS migration and updating the app to use the dedicated Prisma role:

1. Rotate the old Supabase database password or stop using the old role in app secrets.
2. Update local `.env`, CI secrets, and SST secrets.
3. Check Supabase API and database logs around the warning date, especially requests against `User`, `Account`, `Session`, `Project`, `Task`, and `Tag`.
4. If logs indicate `User.password` hashes were accessed, force password resets for affected users.

## Verification

Run the migration and app checks:

```bash
npx prisma migrate deploy
npx prisma generate
npm run lint
npm run test
npm run build
```

Smoke-test app access through the Next.js UI:

- Sign up and sign in.
- Create a project.
- Add, update, and delete tasks.
- Add, update, and delete tags.
- Update profile data.

Verify direct Supabase Data API access is denied with the anon key:

```bash
curl 'https://[PROJECT_REF].supabase.co/rest/v1/User?select=*' \
  -H 'apikey: [SUPABASE_ANON_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_ANON_KEY]'

curl 'https://[PROJECT_REF].supabase.co/rest/v1/Project?select=*' \
  -H 'apikey: [SUPABASE_ANON_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_ANON_KEY]'

curl 'https://[PROJECT_REF].supabase.co/rest/v1/Task?select=*' \
  -H 'apikey: [SUPABASE_ANON_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_ANON_KEY]'

curl 'https://[PROJECT_REF].supabase.co/rest/v1/Tag?select=*' \
  -H 'apikey: [SUPABASE_ANON_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_ANON_KEY]'
```

The response should contain no table data and should be denied by RLS/API permissions.
