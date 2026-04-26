import Head from "next/head";
import { useState, type ReactNode } from "react";

import { Header } from "~/components/layout/Header";
import { Sidebar } from "~/components/layout/Sidebar";

type AppLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AppLayout({ title, description, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = `${title} - Task Manager`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-h-screen lg:pl-72">
          <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </>
  );
}
