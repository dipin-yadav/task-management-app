import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { AppLayout } from "~/components/layout/AppLayout";
import { TaskBoard } from "~/components/tasks/TaskBoard";
import { TaskFilters, type TaskFilterState } from "~/components/tasks/TaskFilters";
import { TaskForm, type TaskFormValues } from "~/components/tasks/TaskForm";
import { Badge, statusTone } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Modal } from "~/components/ui/Modal";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import { getErrorMessage, statusLabels, type TaskStatusValue } from "~/utils/format";

const initialFilters: TaskFilterState = {
  search: "",
  status: "",
  priority: "",
  assigneeId: "",
  tagId: "",
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const projectId = typeof router.query.id === "string" ? router.query.id : "";
  const utils = api.useUtils();

  const [filters, setFilters] = useState<TaskFilterState>(initialFilters);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const projectQuery = api.project.getById.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId) },
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
    { enabled: Boolean(projectId) },
  );

  const updateStatus = api.task.updateStatus.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
    },
  });
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.project.getById.invalidate({ id: projectId });
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getRecentActivity.invalidate();
      void utils.dashboard.getMyTasks.invalidate();
    },
  });

  const project = projectQuery.data;
  const tags = tagsQuery.data ?? [];

  const handleStatusChange = (taskId: string, status: TaskStatusValue) => {
    void updateStatus.mutateAsync({ id: taskId, status });
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    setFormError("");

    try {
      const task = await createTask.mutateAsync({
        projectId,
        title: values.title,
        description: values.description,
        priority: values.priority,
        deadline: values.deadline,
        assigneeId: values.assigneeId,
        tagIds: values.tagIds,
      });

      if (values.status !== "TODO") {
        await updateStatus.mutateAsync({ id: task.id, status: values.status });
      }

      setTaskModalOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <AppLayout title={project?.name ?? "Project"} description="Project task board">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link href="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Projects
              </Link>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm text-slate-600">{project?.name ?? "Loading"}</span>
            </div>
            <h2 className="truncate text-2xl font-semibold text-slate-950">
              {project?.name ?? "Loading project..."}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              {project?.description ?? "No project description"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setTaskModalOpen(true)}>
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

        {project ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <StatusCount label="To do" value={project.taskCounts.TODO} status="TODO" />
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
            <StatusCount label="Done" value={project.taskCounts.DONE} status="DONE" />
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

        {tasksQuery.isLoading ? <p className="text-sm text-slate-500">Loading tasks...</p> : null}

        {tasksQuery.data && tasksQuery.data.length > 0 ? (
          <TaskBoard
            tasks={tasksQuery.data}
            projectId={projectId}
            onStatusChange={handleStatusChange}
          />
        ) : null}

        {tasksQuery.data?.length === 0 ? (
          <EmptyState
            title="No tasks match this view"
            description="Create a task or adjust the filters to see more work on the board."
          />
        ) : null}
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
