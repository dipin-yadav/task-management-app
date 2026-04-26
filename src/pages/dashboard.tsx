import Link from "next/link";

import { AppLayout } from "~/components/layout/AppLayout";
import { TaskCard } from "~/components/tasks/TaskCard";
import { Badge, statusTone } from "~/components/ui/Badge";
import { ButtonLink } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { requireAuth } from "~/server/requireAuth";
import { type RouterOutputs, api } from "~/utils/api";
import { formatDate, statusLabels } from "~/utils/format";

type DashboardTask = RouterOutputs["dashboard"]["getRecentActivity"][number];

export default function DashboardPage() {
  const statsQuery = api.dashboard.getStats.useQuery();
  const upcomingQuery = api.dashboard.getUpcomingDeadlines.useQuery({
    days: 14,
  });
  const recentQuery = api.dashboard.getRecentActivity.useQuery({ limit: 8 });
  const myTasksQuery = api.dashboard.getMyTasks.useQuery();
  const projectsQuery = api.project.list.useQuery();

  const stats = statsQuery.data;

  return (
    <AppLayout
      title="Dashboard"
      description="Overview of your projects and tasks"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Today&apos;s workspace</p>
            <h2 className="text-2xl font-semibold text-slate-950">
              Project overview
            </h2>
          </div>
          <ButtonLink href="/projects/new">New project</ButtonLink>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total tasks"
            value={stats?.total ?? 0}
            loading={statsQuery.isLoading}
          />
          <StatCard
            label="To do"
            value={stats?.todo ?? 0}
            loading={statsQuery.isLoading}
          />
          <StatCard
            label="In progress"
            value={stats?.inProgress ?? 0}
            loading={statsQuery.isLoading}
          />
          <StatCard
            label="In review"
            value={stats?.inReview ?? 0}
            loading={statsQuery.isLoading}
          />
          <StatCard
            label="Done"
            value={stats?.done ?? 0}
            loading={statsQuery.isLoading}
          />
        </div>

        {projectsQuery.data?.length === 0 ? (
          <EmptyState
            title="Create your first project"
            description="Projects hold members, tags, and the Kanban board your team will work from."
            actionLabel="New project"
            actionHref="/projects/new"
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  My tasks
                </h3>
                <p className="text-sm text-slate-500">
                  Assigned to you across all projects.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                View projects
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {myTasksQuery.data?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={task.project.id}
                />
              ))}
            </div>
            {myTasksQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading tasks...</p>
            ) : null}
            {myTasksQuery.data?.length === 0 ? (
              <EmptyState
                title="No assigned tasks"
                description="Tasks assigned to you will appear here once projects get moving."
              />
            ) : null}
          </section>

          <div className="space-y-6">
            <TaskListPanel
              title="Upcoming deadlines"
              description="Due in the next 14 days."
              tasks={upcomingQuery.data}
              loading={upcomingQuery.isLoading}
            />
            <TaskListPanel
              title="Recent activity"
              description="Recently updated project tasks."
              tasks={recentQuery.data}
              loading={recentQuery.isLoading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">
        {loading ? "-" : value}
      </p>
    </div>
  );
}

function TaskListPanel({
  title,
  description,
  tasks,
  loading,
}: {
  title: string;
  description: string;
  tasks: DashboardTask[] | undefined;
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-3">
        {tasks?.map((task) => (
          <Link
            key={task.id}
            href={`/projects/${task.project.id}/tasks/${task.id}`}
            className="block rounded-md border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950">
                  {task.title}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {task.project.name}
                </p>
              </div>
              <Badge tone={statusTone[task.status]}>
                {statusLabels[task.status]}
              </Badge>
            </div>
            {task.deadline ? (
              <p className="mt-2 text-xs text-slate-500">
                Due {formatDate(task.deadline)}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}
      {tasks?.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing to show.</p>
      ) : null}
    </section>
  );
}

export const getServerSideProps = requireAuth;
