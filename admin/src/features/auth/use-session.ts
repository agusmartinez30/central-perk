"use client";

import { useSyncExternalStore } from "react";
import { sessionStore, type SessionState } from "./session-store";

/** Current staff session; `unknown` until the client has asked `GET /auth/me`. */
export function useSession(): SessionState {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
}
