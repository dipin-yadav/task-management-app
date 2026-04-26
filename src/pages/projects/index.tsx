import Link from "next/link";

import { AppLayout } from "~/components/layout/AppLayout";
import { ButtonLink } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import { formatDate } from "~/utils/format";

export default function ProjectsPage() {
  const projectsQuery = api.project.list.useQuery();

  return (
    <AppLayout title="Projects" description="Your project workspace">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Shared workspaces</p>
            <h2 className="text-2xl font-semibold text-slate-950">Projects</h2>
          </div>
          <ButtonLink href="/projects/new">New project</ButtonLink>
        </div>

        {projectsQuery.isLoading ? <p className="text-sm text-slate-500">Loading projects...</p> : null}

        {projectsQuery.data?.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project to start adding tasks, tags, and collaborators."
            actionLabel="New project"
            actionHref="/projects/new"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-950">{project.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {project.description ?? "No description"}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-slate-500">Tasks</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {project._count.tasks}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-slate-500">Members</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {project._count.members}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Updated {formatDate(project.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export const getServerSideProps = requireAuth;
