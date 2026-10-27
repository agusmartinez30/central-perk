import { fetchCurrentStaff, logout, type AuthResult, type StaffProfile } from "./auth-api";

/**
 * Staff session as the admin sees it. `unknown` while prerendering/hydrating and until
 * `GET /auth/me` answers; then `ready`, with `staff: null` when signed out.
 */
export type SessionState =
  | { status: "unknown" }
  | { status: "ready"; staff: StaffProfile | null };

const UNKNOWN: SessionState = { status: "unknown" };

/** External store for `useSyncExternalStore`; the session itself is the API's httpOnly cookie. */
export function createSessionStore(fetchStaff: () => Promise<AuthResult<StaffProfile>>) {
  let state: SessionState = UNKNOWN;
  let loading = false;
  const listeners = new Set<() => void>();

  const set = (next: SessionState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const load = async () => {
    loading = true;
    const result = await fetchStaff();
    loading = false;
    // A sign-in or sign-out that happened meanwhile is newer than this answer.
    if (state !== UNKNOWN) return;
    set({ status: "ready", staff: result.ok ? result.value : null });
  };

  return {
    getSnapshot: (): SessionState => state,
    getServerSnapshot: (): SessionState => UNKNOWN,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      if (state === UNKNOWN && !loading) void load();
      return () => {
        listeners.delete(listener);
      };
    },
    signIn(staff: StaffProfile) {
      set({ status: "ready", staff });
    },
    signOut() {
      set({ status: "ready", staff: null });
    },
  };
}

export const sessionStore = createSessionStore(fetchCurrentStaff);

/**
 * Revokes the session in the API and forgets it locally. The local state is cleared even
 * when the request fails, so the admin always lands back on `/login`.
 */
export async function signOutStaff(): Promise<void> {
  await logout();
  sessionStore.signOut();
}
