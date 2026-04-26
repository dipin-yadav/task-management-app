import { Input, Select } from "~/components/ui/Field";
import { type RouterOutputs } from "~/utils/api";
import {
  priorityLabels,
  statusLabels,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "~/utils/format";

type ProjectMember = RouterOutputs["project"]["getById"]["members"][number];
type Tag = RouterOutputs["tag"]["list"][number];

export type TaskFilterState = {
  search: string;
  status: "" | TaskStatusValue;
  priority: "" | TaskPriorityValue;
  assigneeId: string;
  tagId: string;
};

type TaskFiltersProps = {
  filters: TaskFilterState;
  members: ProjectMember[];
  tags: Tag[];
  onChange: (filters: TaskFilterState) => void;
};

export function TaskFilters({ filters, members, tags, onChange }: TaskFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <Input
        label="Search"
        placeholder="Title or description"
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.currentTarget.value })}
      />
      <Select
        label="Status"
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.currentTarget.value as "" | TaskStatusValue })
        }
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </Select>
      <Select
        label="Priority"
        value={filters.priority}
        onChange={(event) =>
          onChange({ ...filters, priority: event.currentTarget.value as "" | TaskPriorityValue })
        }
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priorityLabels[priority]}
          </option>
        ))}
      </Select>
      <Select
        label="Assignee"
        value={filters.assigneeId}
        onChange={(event) => onChange({ ...filters, assigneeId: event.currentTarget.value })}
      >
        <option value="">Anyone</option>
        {members.map((member) => (
          <option key={member.user.id} value={member.user.id}>
            {member.user.name ?? member.user.email}
          </option>
        ))}
      </Select>
      <Select
        label="Tag"
        value={filters.tagId}
        onChange={(event) => onChange({ ...filters, tagId: event.currentTarget.value })}
      >
        <option value="">Any tag</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
