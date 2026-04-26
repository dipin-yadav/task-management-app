import { type ReactNode } from "react";

import { cn } from "~/utils/cn";
import { type TaskPriorityValue, type TaskStatusValue } from "~/utils/format";

type BadgeTone = "slate" | "blue" | "emerald" | "amber" | "rose" | "violet";

const toneClasses: Record<BadgeTone, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const priorityTone: Record<TaskPriorityValue, BadgeTone> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "rose",
};

export const statusTone: Record<TaskStatusValue, BadgeTone> = {
  TODO: "slate",
  IN_PROGRESS: "blue",
  IN_REVIEW: "violet",
  DONE: "emerald",
};
