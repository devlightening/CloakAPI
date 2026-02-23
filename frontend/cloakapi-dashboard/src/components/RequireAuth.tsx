"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/useSession";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.loaded) return;
    if (!session.token) router.replace("/login");
  }, [router, session.loaded, session.token]);

  if (!session.loaded) return null;
  if (!session.token) return null;
  return <>{children}</>;
}
