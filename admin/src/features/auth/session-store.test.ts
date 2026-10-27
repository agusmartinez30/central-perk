import { describe, expect, it, vi } from "vitest";
import type { AuthResult, StaffProfile } from "./auth-api";
import { createSessionStore } from "./session-store";

const STAFF: StaffProfile = { id: "staff-1", email: "a@b.co", name: "Sofía M.", role: "OWNER" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("createSessionStore", () => {
  it("is unknown until the first subscriber loads the session from /auth/me", async () => {
    const fetchStaff = vi.fn(async (): Promise<AuthResult<StaffProfile>> => ({ ok: true, value: STAFF }));
    const store = createSessionStore(fetchStaff);
    expect(store.getSnapshot()).toEqual({ status: "unknown" });
    expect(store.getServerSnapshot()).toEqual({ status: "unknown" });
    expect(fetchStaff).not.toHaveBeenCalled();

    const listener = vi.fn();
    store.subscribe(listener);
    await vi.waitFor(() => expect(store.getSnapshot()).toEqual({ status: "ready", staff: STAFF }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("is ready and signed out when the session is invalid or the API is unreachable", async () => {
    for (const error of ["invalid-session", "network"] as const) {
      const store = createSessionStore(async () => ({ ok: false, error }));
      store.subscribe(() => {});
      await vi.waitFor(() => expect(store.getSnapshot()).toEqual({ status: "ready", staff: null }));
    }
  });

  it("loads once for several subscribers and keeps the snapshot referentially stable", async () => {
    const fetchStaff = vi.fn(async (): Promise<AuthResult<StaffProfile>> => ({ ok: true, value: STAFF }));
    const store = createSessionStore(fetchStaff);
    store.subscribe(() => {});
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe("ready"));
    store.subscribe(() => {});

    expect(fetchStaff).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("signs in and out without a request and notifies subscribers", () => {
    const fetchStaff = vi.fn(async (): Promise<AuthResult<StaffProfile>> => ({ ok: true, value: STAFF }));
    const store = createSessionStore(fetchStaff);
    const listener = vi.fn();

    store.signIn(STAFF);
    store.subscribe(listener);
    expect(store.getSnapshot()).toEqual({ status: "ready", staff: STAFF });

    store.signOut();
    expect(store.getSnapshot()).toEqual({ status: "ready", staff: null });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(fetchStaff).not.toHaveBeenCalled();
  });

  it("ignores a load that resolves after a sign-in", async () => {
    const pending = deferred<AuthResult<StaffProfile>>();
    const store = createSessionStore(() => pending.promise);
    store.subscribe(() => {});

    store.signIn(STAFF);
    pending.resolve({ ok: false, error: "invalid-session" });
    await pending.promise;
    await Promise.resolve();

    expect(store.getSnapshot()).toEqual({ status: "ready", staff: STAFF });
  });

  it("stops notifying after unsubscribing", () => {
    const store = createSessionStore(async () => ({ ok: true, value: STAFF }));
    store.signIn(STAFF);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.signOut();
    expect(listener).not.toHaveBeenCalled();
  });
});
