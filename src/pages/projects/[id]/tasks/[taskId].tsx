import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { AppLayout } from "~/components/layout/AppLayout";
import { TaskForm, type TaskFormValues } from "~/components/tasks/TaskForm";
import { TagBadge } from "~/components/tags/TagBadge";
import { Avatar } from "~/components/ui/Avatar";
import { Badge, priorityTone, statusTone } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { HistoryTimeline } from "~/components/history/HistoryTimeline";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import {
  formatDateTime,
  getErrorMessage,
  priorityLabels,
  statusLabels,
} from "~/utils/format";

export default function TaskDetailPage() {
  const router = useRouter();
  const projectId = typeof router.query.id === "string" ? router.query.id : "";
  const taskId =
    typeof router.query.taskId === "string" ? router.query.taskId : "";
  const utils = api.useUtils();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const taskQuery = api.task.getById.useQuery(
    { id: taskId },
    { enabled: Boolean(taskId) },
  );
  const projectQuery = api.project.getById.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId) },
  );
  const tagsQuery = api.tag.list.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );
  const historyQuery = api.history.listTaskHistory.useQuery(
    { taskId },
    { enabled: Boolean(taskId) },
  );

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      void utils.task.getById.invalidate({ id: taskId });
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getRecentActivity.invalidate();
      void utils.dashboard.getMyTasks.invalidate();
      void utils.history.listTaskHistory.invalidate({ taskId });
    },
  });
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getRecentActivity.invalidate();
      void utils.dashboard.getMyTasks.invalidate();
    },
  });

  const task = taskQuery.data;
  const project = projectQuery.data;

  const handleUpdateTask = async (values: TaskFormValues) => {
    setMessage("");

    try {
      await updateTask.mutateAsync({
        id: taskId,
        title: values.title,
        description: values.description ?? "",
        status: values.status,
        priority: values.priority,
        deadline: values.deadline ?? null,
        assigneeId: values.assigneeId ?? null,
        tagIds: values.tagIds,
      });

      setEditing(false);
      setMessage("Task updated.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await deleteTask.mutateAsync({ id: taskId });
      void router.push(`/projects/${projectId}`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <AppLayout title={task?.title ?? "Task"} description="Task detail">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/projects"
                className="font-medium text-slate-500 hover:text-slate-950"
              >
                Projects
              </Link>
              <span className="text-slate-400">/</span>
              <Link
                href={`/projects/${projectId}`}
                className="font-medium text-slate-500 hover:text-slate-950"
              >
                {project?.name ?? task?.project.name ?? "Project"}
              </Link>
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">
              {task?.title ?? "Loading task..."}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? "View task" : "Edit task"}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteTask.isPending}
              onClick={handleDeleteTask}
            >
              Delete
            </Button>
          </div>
        </div>

        {message ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        ) : null}

        {editing && task && project ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <TaskForm
              members={project.members}
              tags={tagsQuery.data ?? []}
              includeStatus
              initialValue={{
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                deadline: task.deadline,
                assigneeId: task.assigneeId,
                tags: task.tags.map(({ tag }) => ({ tagId: tag.id })),
              }}
              initialValueKey={task.id}
              submitLabel="Save task"
              isSubmitting={updateTask.isPending}
              errorMessage={
                message && message !== "Task updated." ? message : undefined
              }
              onCancel={() => setEditing(false)}
              onSubmit={handleUpdateTask}
            />
          </section>
        ) : null}

        {!editing && task ? (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone={statusTone[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
                <Badge tone={priorityTone[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
                {task.tags.map(({ tag }) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </h3>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {task.description ?? "No description"}
                  </div>
                </div>
                <aside className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assignee
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar
                        size="sm"
                        name={task.assignee?.name}
                        image={task.assignee?.image}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {task.assignee?.name ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                  <DetailItem
                    label="Creator"
                    value={task.creator.name ?? "Unknown"}
                  />
                  <DetailItem
                    label="Deadline"
                    value={formatDateTime(task.deadline)}
                  />
                  <DetailItem
                    label="Created"
                    value={formatDateTime(task.createdAt)}
                  />
                  <DetailItem
                    label="Updated"
                    value={formatDateTime(task.updatedAt)}
                  />
                </aside>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-medium text-slate-900">
                Task History
              </h3>
              {historyQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading history...</p>
              ) : historyQuery.isError ? (
                historyQuery.error.data?.code === "FORBIDDEN" ? (
                  <p className="text-sm text-slate-500 italic">
                    History is only visible to project admins or the task
                    assignee.
                  </p>
                ) : (
                  <p className="text-sm text-rose-600">
                    {historyQuery.error.message}
                  </p>
                )
              ) : (
                <HistoryTimeline activities={historyQuery.data ?? []} />
              )}
            </section>
          </>
        ) : null}

        {taskQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading task...</p>
        ) : null}
      </div>
    </AppLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export const getServerSideProps = requireAuth;
