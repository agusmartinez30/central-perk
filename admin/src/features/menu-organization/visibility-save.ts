import { delay } from "@/shared/lib/delay";

/** What a visibility switch belongs to: an 08A moment card or an 08C category row. */
export type VisibilityTarget = "moment" | "category";

/** Persists a visibility switch; rejects when the save fails. */
export type VisibilitySaver = (target: VisibilityTarget, id: string, visible: boolean) => Promise<void>;

/** Simulated latency of the visibility save, long enough to show "Actualizando…" (as 07). */
export const VISIBILITY_SAVE_DELAY_MS = 900;

/**
 * Mock rule: no save fails by default. The 08 exports show "Actualizando…" but no failure
 * state, so nothing in the catalogue is picked to fail; tests inject `failingKeys`
 * ("moment:<id>" / "category:<id>") to cover the revert.
 */
export const FAILING_VISIBILITY_KEYS: readonly string[] = [];

type VisibilitySaverOptions = {
  wait?: (ms: number) => Promise<void>;
  failingKeys?: readonly string[];
};

export function createVisibilitySaver({
  wait = delay,
  failingKeys = FAILING_VISIBILITY_KEYS,
}: VisibilitySaverOptions = {}): VisibilitySaver {
  return async (target, id) => {
    await wait(VISIBILITY_SAVE_DELAY_MS);
    if (failingKeys.includes(`${target}:${id}`)) throw new Error("No se pudo guardar");
  };
}

/** Default saver of the 08 lists: simulated latency plus the mock failure rule. */
export const saveVisibility = createVisibilitySaver();
