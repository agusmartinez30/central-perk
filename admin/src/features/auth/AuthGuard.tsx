"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./use-session";

/**
 * Sends visitors without an authenticated mock session to `/login`. Content still renders
 * meanwhile so prerendered pages stay static; this is a prototype gate, not security.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSession();
  const signedIn = state.status === "ready" && state.session?.stage === "authenticated";

  useEffect(() => {
    if (state.status === "ready" && !signedIn) router.replace("/login");
  }, [router, signedIn, state.status]);

  return children;
}
