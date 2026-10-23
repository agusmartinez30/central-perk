"use client";

import { useSearchParams } from "next/navigation";
import { parseScreenState } from "./screen-state";

/**
 * Forced screen variant from `?state=`. It reads search params, so under Cache Components
 * the calling Client Component must render inside a `<Suspense>` boundary.
 */
export function useScreenState<T extends string>(allowed: readonly T[]): T | null {
  const searchParams = useSearchParams();
  return parseScreenState(searchParams.get("state"), allowed);
}
