"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/useSession";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.loaded) return;
    if (!session.token) router.replace("/login");
    else if (!session.isAdmin) {
      const msg = encodeURIComponent("Not authorized. Admin role required.");
      router.replace(`/me?message=${msg}`);
    }
  }, [router, session.loaded, session.token, session.isAdmin]);

  if (!session.loaded) {
    return (
      <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Loading...
      </div>
    );
  }

  if (!session.token) return null;
  if (!session.isAdmin) return null;
  return <>{children}</>;
}
