"use client";

import { useSyncExternalStore } from "react";
import { parseStoredSession, readSessionSnapshot, subscribeToSession, type StoredSession } from "./session";

/** Sentinel snapshot used while prerendering/hydrating, when storage cannot be read yet. */
const SERVER_SNAPSHOT = "__server__";

export type SessionState =
  | { status: "unknown" }
  | { status: "ready"; session: StoredSession | null };

/** Current mock session; `unknown` until the client has read Web Storage. */
export function useSession(): SessionState {
  const raw = useSyncExternalStore(
    subscribeToSession,
    readSessionSnapshot,
    () => SERVER_SNAPSHOT,
  );
  if (raw === SERVER_SNAPSHOT) return { status: "unknown" };
  return { status: "ready", session: parseStoredSession(raw) };
}
