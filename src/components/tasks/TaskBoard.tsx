import { useState } from "react";

import { TaskCard } from "~/components/tasks/TaskCard";
import { cn } from "~/utils/cn";
import {
  statusLabels,
  TASK_STATUSES,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "~/utils/format";

type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  deadline: Date | null;
  assignee: {
    id: string;
    name: string | null;
    email?: string | null;
    image: string | null;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
};

type TaskBoardProps = {
  tasks: BoardTask[];
  projectId: string;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
};

export function TaskBoard({ tasks, projectId, onStatusChange }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<TaskStatusValue | null>(null);

  const handleDrop = (status: TaskStatusValue) => {
    if (!draggedTaskId) return;
    onStatusChange(draggedTaskId, status);
    setDraggedTaskId(null);
    setDragTarget(null);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <section
            key={status}
            className={cn(
              "min-h-80 rounded-lg border border-slate-200 bg-slate-100/70 p-3",
              dragTarget === status && "border-slate-400 bg-slate-200",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragTarget(status);
            }}
            onDragLeave={() => setDragTarget(null)}
            onDrop={() => handleDrop(status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">{statusLabels[status]}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  draggable
                  onDragStart={setDraggedTaskId}
                  onStatusChange={onStatusChange}
                />
              ))}
              {columnTasks.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-white/70 px-3 py-8 text-center text-sm text-slate-500">
                  No tasks
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
