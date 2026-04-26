import { type GetServerSidePropsContext } from "next";
import Head from "next/head";
import Link from "next/link";

import { getServerAuthSession } from "~/server/auth";

export default function Home() {
  return (
    <>
      <Head>
        <title>Task Manager</title>
        <meta name="description" content="Task management and collaboration tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Team task management
            </p>
            <h1 className="mt-4 text-5xl font-bold text-slate-950 sm:text-6xl">
              Plan projects, assign work, and keep tasks moving.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A focused workspace for projects, Kanban task tracking, members,
              priorities, deadlines, and project tags.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signin"
                className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerAuthSession(ctx);

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return { props: { session: null } };
}
