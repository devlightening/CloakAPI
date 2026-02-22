"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "../lib/auth";

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

  return (
    <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            CloakAPI
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Dashboard</div>
        </div>

        <div className="flex items-center gap-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/audit" label="Audit" />
          <button
            className="ml-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
