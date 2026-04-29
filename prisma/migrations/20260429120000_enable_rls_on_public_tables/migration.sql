-- Enable Row-Level Security on every application table in the exposed public schema.
--
-- No policies are created here intentionally. Supabase's Data API uses the anon
-- and authenticated roles, so RLS with no policies denies direct table access by
-- default. The server-side Prisma connection must use a trusted database role
-- such as the dedicated prisma role documented in docs/supabase-security.md.

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskTag" ENABLE ROW LEVEL SECURITY;
