import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { Avatar } from "~/components/ui/Avatar";
import { Button } from "~/components/ui/Button";

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
};

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm lg:hidden"
            onClick={onMenuClick}
          >
            Menu
          </button>
          <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="hidden max-w-48 items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 sm:flex"
          >
            <Avatar
              size="sm"
              name={session?.user.name}
              email={session?.user.email}
              image={session?.user.image}
            />
            <span className="truncate text-sm font-medium text-slate-700">
              {session?.user.name ?? session?.user.email ?? "Account"}
            </span>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
