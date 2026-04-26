import Link from "next/link";
import { useRouter } from "next/router";

import { ButtonLink } from "~/components/ui/Button";
import { cn } from "~/utils/cn";
import { api } from "~/utils/api";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/profile", label: "Profile" },
] as const;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const projectsQuery = api.project.list.useQuery();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/dashboard" className="font-semibold text-slate-950" onClick={onClose}>
            Task Manager
          </Link>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            X
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const active =
                router.pathname === item.href ||
                (item.href !== "/dashboard" && router.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Projects
              </p>
              <Link
                href="/projects/new"
                onClick={onClose}
                className="rounded px-1.5 py-0.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                aria-label="New project"
              >
                +
              </Link>
            </div>
            <div className="space-y-1">
              {projectsQuery.isLoading ? (
                <p className="px-3 py-2 text-sm text-slate-500">Loading projects...</p>
              ) : null}
              {projectsQuery.data?.slice(0, 10).map((project) => {
                const href = `/projects/${project.id}`;
                const active = router.asPath === href || router.asPath.startsWith(`${href}/`);

                return (
                  <Link
                    key={project.id}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "block truncate rounded-md px-3 py-2 text-sm transition",
                      active
                        ? "bg-slate-100 font-medium text-slate-950"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                    title={project.name}
                  >
                    {project.name}
                  </Link>
                );
              })}
              {projectsQuery.data?.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No projects yet</p>
              ) : null}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <ButtonLink href="/projects/new" className="w-full" onClick={onClose}>
            New project
          </ButtonLink>
        </div>
      </aside>
    </>
  );
}
