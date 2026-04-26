import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "~/utils/cn";

const controlClasses =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      {children}
      {error ? <span className="block text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <input className={cn(controlClasses, className)} {...props} />
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <textarea className={cn(controlClasses, "min-h-28 resize-y", className)} {...props} />
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Select({ label, hint, error, className, children, ...props }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <select className={cn(controlClasses, className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
