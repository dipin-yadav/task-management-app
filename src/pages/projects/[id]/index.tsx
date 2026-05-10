import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSession } from "next-auth/react";

import { AppLayout } from "~/components/layout/AppLayout";
import { TaskBoard } from "~/components/tasks/TaskBoard";
import {
  TaskFilters,
  type TaskFilterState,
} from "~/components/tasks/TaskFilters";
import { TaskForm, type TaskFormValues } from "~/components/tasks/TaskForm";
import { Badge, statusTone } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Modal } from "~/components/ui/Modal";
import { HistoryTimeline } from "~/components/history/HistoryTimeline";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import {
  getErrorMessage,
  statusLabels,
  type TaskStatusValue,
} from "~/utils/format";

const initialFilters: TaskFilterState = {
  search: "",
  status: "",
  priority: "",
  assigneeId: "",
  tagId: "",
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const session = useSession();
  const projectId = typeof router.query.id === "string" ? router.query.id : "";
  const utils = api.useUtils();

  const [filters, setFilters] = useState<TaskFilterState>(initialFilters);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [boardMessage, setBoardMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"board" | "history">("board");

  const projectQuery = api.project.getById.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId) },
  );

  const currentUserMembership = projectQuery.data?.members.find(
    (m) => m.userId === session.data?.user.id,
  );
  const canSeeHistory =
    currentUserMembership?.role === "OWNER" ||
    currentUserMembership?.role === "ADMIN";

  const historyQuery = api.history.listProjectHistory.useQuery(
    { projectId },
    { enabled: Boolean(projectId) && canSeeHistory && activeTab === "history" },
  );

  const tagsQuery = api.tag.list.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );
  const tasksQuery = api.task.list.useQuery(
    {
      projectId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.tagId ? { tagIds: [filters.tagId] } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    },
    { enabled: Boolean(projectId) && activeTab === "board" },
  );

  const updateStatus = api.task.updateStatus.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
      void utils.history.listProjectHistory.invalidate({ projectId });
    },
  });
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getRecentActivity.invalidate();
      void utils.dashboard.getMyTasks.invalidate();
      void utils.history.listProjectHistory.invalidate({ projectId });
    },
  });

  const project = projectQuery.data;
  const tags = tagsQuery.data ?? [];

  const handleStatusChange = async (
    taskId: string,
    status: TaskStatusValue,
  ) => {
    setBoardMessage("");

    try {
      await updateStatus.mutateAsync({ id: taskId, status });
    } catch (error) {
      setBoardMessage(
        `Failed to update task status: ${getErrorMessage(error)}`,
      );
    }
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    setFormError("");

    try {
      await createTask.mutateAsync({
        projectId,
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        deadline: values.deadline,
        assigneeId: values.assigneeId,
        tagIds: values.tagIds,
      });

      setTaskModalOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <AppLayout
      title={project?.name ?? "Project"}
      description="Project task board"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link
                href="/projects"
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Projects
              </Link>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm text-slate-600">
                {project?.name ?? "Loading"}
              </span>
            </div>
            <h2 className="truncate text-2xl font-semibold text-slate-950">
              {project?.name ?? "Loading project..."}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              {project?.description ?? "No project description"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTaskModalOpen(true)}
            >
              New task
            </Button>
            <Link
              href={`/projects/${projectId}/settings`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("board")}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "board"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              Task Board
            </button>
            {canSeeHistory && (
              <button
                onClick={() => setActiveTab("history")}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                Project History
              </button>
            )}
          </nav>
        </div>

        {activeTab === "board" && (
          <>
            {project ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <StatusCount
                  label="To do"
                  value={project.taskCounts.TODO}
                  status="TODO"
                />
                <StatusCount
                  label="In progress"
                  value={project.taskCounts.IN_PROGRESS}
                  status="IN_PROGRESS"
                />
                <StatusCount
                  label="In review"
                  value={project.taskCounts.IN_REVIEW}
                  status="IN_REVIEW"
                />
                <StatusCount
                  label="Done"
                  value={project.taskCounts.DONE}
                  status="DONE"
                />
              </div>
            ) : null}

            {project ? (
              <TaskFilters
                filters={filters}
                members={project.members}
                tags={tags}
                onChange={setFilters}
              />
            ) : null}

            {tasksQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading tasks...</p>
            ) : null}

            {boardMessage ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {boardMessage}
              </div>
            ) : null}

            {!tasksQuery.isLoading && tasksQuery.isError ? (
              <EmptyState
                title="Failed to load tasks"
                description={tasksQuery.error.message}
              />
            ) : null}

            {!tasksQuery.isLoading &&
            !tasksQuery.isError &&
            tasksQuery.data &&
            tasksQuery.data.length > 0 ? (
              <TaskBoard
                tasks={tasksQuery.data}
                projectId={projectId}
                onStatusChange={handleStatusChange}
              />
            ) : null}

            {!tasksQuery.isLoading &&
            !tasksQuery.isError &&
            tasksQuery.data?.length === 0 ? (
              <EmptyState
                title="No tasks match this view"
                description="Create a task or adjust the filters to see more work on the board."
              />
            ) : null}
          </>
        )}

        {activeTab === "history" && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-medium text-slate-900">
              Project Activity Timeline
            </h3>
            {historyQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : historyQuery.isError ? (
              <p className="text-sm text-rose-600">
                {historyQuery.error.message}
              </p>
            ) : (
              <HistoryTimeline activities={historyQuery.data ?? []} />
            )}
          </div>
        )}
      </div>

      <Modal
        open={taskModalOpen}
        title="New task"
        description="Create a task for this project."
        onClose={() => setTaskModalOpen(false)}
      >
        {project ? (
          <TaskForm
            members={project.members}
            tags={tags}
            includeStatus
            submitLabel="Create task"
            isSubmitting={createTask.isPending || updateStatus.isPending}
            errorMessage={formError}
            onCancel={() => setTaskModalOpen(false)}
            onSubmit={handleCreateTask}
          />
        ) : null}
      </Modal>
    </AppLayout>
  );
}

function StatusCount({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: TaskStatusValue;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export const getServerSideProps = requireAuth;
