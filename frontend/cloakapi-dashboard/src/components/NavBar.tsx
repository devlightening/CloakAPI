"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../lib/useSession";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-2 text-sm font-medium " +
        (active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900")
      }
    >
      {label}
    </Link>
  );
}

export function NavBar() {
  const router = useRouter();
  const session = useSession();
  const role = session.role;

  return (
    <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            CloakAPI
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Dashboard</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Role: <span className="font-medium">{role ?? "Unknown"}</span>
          </div>
          {role === "Admin" ? (
            <>
              <NavLink href="/admin" label="Admin" />
              <NavLink href="/admin/audit" label="Audit" />
            </>
          ) : (
            <NavLink href="/me" label="User Me" />
          )}
          <button
            className="ml-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => {
              session.logout();
              router.replace("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
