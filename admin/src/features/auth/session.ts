/**
 * Mock staff session kept in Web Storage. "Recordarme en este dispositivo" stores it in
 * localStorage; otherwise it lives in sessionStorage and ends with the tab.
 */

export type AuthStage = "mfa-pending" | "authenticated";

export type StoredSession = {
  stage: AuthStage;
  staffId: string;
};

const STORAGE_KEY = "cafe-central-admin.session";
const CHANGE_EVENT = "cafe-central-admin:session";
const STAGES: readonly AuthStage[] = ["mfa-pending", "authenticated"];

export function serializeSession(session: StoredSession): string {
  return JSON.stringify(session);
}

export function parseStoredSession(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { stage, staffId } = value as Record<string, unknown>;
    if (typeof stage !== "string" || !STAGES.includes(stage as AuthStage)) return null;
    if (typeof staffId !== "string" || staffId.length === 0) return null;
    return { stage: stage as AuthStage, staffId };
  } catch {
    return null;
  }
}

function safeGet(storage: () => Storage): string | null {
  try {
    return storage().getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeRemove(storage: () => Storage) {
  try {
    storage().removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session simply is not persisted.
  }
}

/** Raw stored value; a string keeps `useSyncExternalStore` snapshots referentially stable. */
export function readSessionSnapshot(): string | null {
  return safeGet(() => window.sessionStorage) ?? safeGet(() => window.localStorage);
}

export function readSession(): StoredSession | null {
  return parseStoredSession(readSessionSnapshot());
}

export function writeSession(session: StoredSession, remember: boolean) {
  clearSession({ silent: true });
  try {
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(STORAGE_KEY, serializeSession(session));
  } catch {
    // Ignored: see safeRemove.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Moves an MFA-pending session to authenticated, keeping the storage the user chose. */
export function completeSession(staffId: string) {
  const remembered = safeGet(() => window.localStorage) !== null;
  writeSession({ stage: "authenticated", staffId }, remembered);
}

export function clearSession({ silent = false }: { silent?: boolean } = {}) {
  safeRemove(() => window.sessionStorage);
  safeRemove(() => window.localStorage);
  if (!silent) window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToSession(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
