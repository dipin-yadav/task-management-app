import { useEffect, useState } from "react";

import { TagPicker } from "~/components/tags/TagPicker";
import { Button } from "~/components/ui/Button";
import { Input, Select, Textarea } from "~/components/ui/Field";
import { type RouterOutputs } from "~/utils/api";
import {
  fromDateInputValue,
  priorityLabels,
  statusLabels,
  TASK_PRIORITIES,
  TASK_STATUSES,
  toDateInputValue,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "~/utils/format";

type ProjectMember = RouterOutputs["project"]["getById"]["members"][number];
type Tag = RouterOutputs["tag"]["list"][number];

type TaskInitialValue = {
  title: string;
  description: string | null;
  status?: TaskStatusValue;
  priority: TaskPriorityValue;
  deadline: Date | null;
  assigneeId: string | null;
  tags: Array<{ tagId: string }>;
};

export type TaskFormValues = {
  title: string;
  description?: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  deadline?: Date;
  assigneeId?: string;
  tagIds: string[];
};

type TaskFormProps = {
  members: ProjectMember[];
  tags: Tag[];
  initialValue?: TaskInitialValue;
  includeStatus?: boolean;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onCancel?: () => void;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
};

const defaultStatus: TaskStatusValue = "TODO";
const defaultPriority: TaskPriorityValue = "MEDIUM";

export function TaskForm({
  members,
  tags,
  initialValue,
  includeStatus = false,
  submitLabel,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [status, setStatus] = useState<TaskStatusValue>(initialValue?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriorityValue>(
    initialValue?.priority ?? defaultPriority,
  );
  const [deadline, setDeadline] = useState(toDateInputValue(initialValue?.deadline));
  const [assigneeId, setAssigneeId] = useState(initialValue?.assigneeId ?? "");
  const [tagIds, setTagIds] = useState(initialValue?.tags.map((tag) => tag.tagId) ?? []);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!initialValue) return;
    setTitle(initialValue.title);
    setDescription(initialValue.description ?? "");
    setStatus(initialValue.status ?? defaultStatus);
    setPriority(initialValue.priority);
    setDeadline(toDateInputValue(initialValue.deadline));
    setAssigneeId(initialValue.assigneeId ?? "");
    setTagIds(initialValue.tags.map((tag) => tag.tagId));
  }, [initialValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTitleError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Task title is required");
      return;
    }

    const trimmedDescription = description.trim();

    await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription === "" ? undefined : trimmedDescription,
      status,
      priority,
      deadline: fromDateInputValue(deadline),
      assigneeId: assigneeId === "" ? undefined : assigneeId,
      tagIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <Input
        label="Title"
        value={title}
        maxLength={200}
        error={titleError}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      <Textarea
        label="Description"
        value={description}
        maxLength={5000}
        onChange={(event) => setDescription(event.currentTarget.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {includeStatus ? (
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value as TaskStatusValue)}
          >
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          label="Priority"
          value={priority}
          onChange={(event) => setPriority(event.currentTarget.value as TaskPriorityValue)}
        >
          {TASK_PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {priorityLabels[item]}
            </option>
          ))}
        </Select>
        <Input
          label="Deadline"
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.currentTarget.value)}
        />
        <Select
          label="Assignee"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.currentTarget.value)}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name ?? member.user.email}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Tags</p>
        <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
