import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";

import { cn } from "~/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-400",
  secondary:
    "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300",
  ghost:
    "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger:
    "border-transparent bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300",
  outline:
    "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & BaseButtonProps;

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = isLoading ? true : disabled;

  return (
    <button
      type="button"
      aria-busy={isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? "..." : children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  BaseButtonProps & {
    href: string;
  };

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
