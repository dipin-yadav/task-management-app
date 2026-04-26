export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export const statusLabels: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export const priorityLabels: Record<TaskPriorityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const priorityRank: Record<TaskPriorityValue, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "No date";
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "No date";
  return dateTimeFormatter.format(new Date(date));
}

export function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const parsed = new Date(date);
  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateInputValue(value: string) {
  if (!value) return undefined;
  return new Date(value);
}

export function initialsFor(name: string | null | undefined, email?: string | null) {
  const fallback = email?.charAt(0) ?? "?";
  if (!name) return fallback.toUpperCase();

  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (initials === "" ? fallback : initials).toUpperCase();
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
