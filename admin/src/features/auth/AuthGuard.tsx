"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./use-session";

/**
 * Sends visitors without a valid API session (`GET /auth/me`) to `/login`. Content still
 * renders meanwhile so prerendered pages stay static; the API enforces access to its data.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSession();
  const signedIn = state.status === "ready" && state.staff !== null;

  useEffect(() => {
    if (state.status === "ready" && !signedIn) router.replace("/login");
  }, [router, signedIn, state.status]);

  return children;
}
