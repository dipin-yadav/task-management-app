import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";

export default function Home() {
  const { data: sessionData, status } = useSession();

  // Show nothing while session is loading to avoid flash
  if (status === "loading") {
    return (
      <>
        <Head>
          <title>Task Management App</title>
          <meta name="description" content="Task management and collaboration tool" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
          <p className="text-xl text-white/60">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Task Management App</title>
        <meta name="description" content="Task management and collaboration tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Task <span className="text-[hsl(280,100%,70%)]">Manager</span>
          </h1>

          {sessionData ? (
            /* ── Authenticated view ── */
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                <Link
                  className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                  href="/projects"
                >
                  <h3 className="text-2xl font-bold">Projects →</h3>
                  <div className="text-lg">
                    View and manage your projects. Create tasks, assign members,
                    and track progress.
                  </div>
                </Link>
                <Link
                  className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                  href="/profile"
                >
                  <h3 className="text-2xl font-bold">Profile →</h3>
                  <div className="text-lg">
                    Manage your account settings and personal information.
                  </div>
                </Link>
              </div>
              <AuthenticatedInfo />
            </>
          ) : (
            /* ── Welcome / unauthenticated view ── */
            <>
              <p className="text-xl text-white/80">
                Organize your work. Collaborate with your team.
              </p>
              <div className="flex gap-4">
                <Link
                  className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-white no-underline transition hover:bg-[hsl(280,100%,60%)]"
                  href="/auth/signin"
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
                  href="/auth/signup"
                >
                  Sign up
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function AuthenticatedInfo() {
  const { data: sessionData } = useSession();

  const { data: profile } = api.auth.getProfile.useQuery(
    undefined,
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        Logged in as {profile?.name ?? sessionData?.user?.name}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
