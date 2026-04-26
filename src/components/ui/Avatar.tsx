import { initialsFor } from "~/utils/format";
import { cn } from "~/utils/cn";

type AvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, email, image, size = "md", className }: AvatarProps) {
  if (image) {
    return (
      // User-provided external avatar URLs cannot be safely covered by a fixed Next Image allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? email ?? "User avatar"}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white",
        sizeClasses[size],
        className,
      )}
    >
      {initialsFor(name, email)}
    </span>
  );
}
