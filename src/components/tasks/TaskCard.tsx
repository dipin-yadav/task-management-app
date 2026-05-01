import Link from "next/link";

import { Avatar } from "~/components/ui/Avatar";
import { Badge, priorityTone, statusTone } from "~/components/ui/Badge";
import { Select } from "~/components/ui/Field";
import { TagBadge } from "~/components/tags/TagBadge";
import {
  formatDate,
  priorityLabels,
  statusLabels,
  TASK_STATUSES,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "~/utils/format";

type TaskCardTask = {
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

type TaskCardProps = {
  task: TaskCardTask;
  projectId: string;
  draggable?: boolean;
  onDragStart?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatusValue) => void;
};

export function TaskCard({
  task,
  projectId,
  draggable = false,
  onDragStart,
  onStatusChange,
}: TaskCardProps) {
  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(task.id)}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="space-y-3">
        <div>
          <Link
            href={`/projects/${projectId}/tasks/${task.id}`}
            className="line-clamp-2 text-sm font-semibold text-slate-950 hover:text-slate-700"
          >
            {task.title}
          </Link>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
          {task.tags.map(({ tag }) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar
              size="sm"
              name={task.assignee?.name}
              image={task.assignee?.image}
            />
            <span className="truncate text-xs text-slate-600">
              {task.assignee?.name ?? "Unassigned"}
            </span>
          </div>
          <span className="shrink-0 text-xs text-slate-500">{formatDate(task.deadline)}</span>
        </div>

        {onStatusChange ? (
          <Select
            aria-label={`Move ${task.title}`}
            value={task.status}
            onChange={(event) =>
              onStatusChange(task.id, event.currentTarget.value as TaskStatusValue)
            }
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
    </article>
  );
}
