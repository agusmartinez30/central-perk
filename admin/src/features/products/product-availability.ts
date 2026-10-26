import { delay } from "@/shared/lib/delay";

/** Persists a row's availability switch; rejects when the save fails. */
export type AvailabilitySaver = (id: string, available: boolean) => Promise<void>;

/** Simulated latency of the availability save, long enough to show "Actualizando…". */
export const AVAILABILITY_SAVE_DELAY_MS = 900;

/**
 * Mock rule: saves of these products always fail, so the 07A "No se pudo guardar" row can be
 * reproduced from the real list (the export shows it on Cheesecake).
 */
export const FAILING_AVAILABILITY_IDS: readonly string[] = ["cheesecake"];

type AvailabilitySaverOptions = {
  wait?: (ms: number) => Promise<void>;
  failingIds?: readonly string[];
};

export function createAvailabilitySaver({
  wait = delay,
  failingIds = FAILING_AVAILABILITY_IDS,
}: AvailabilitySaverOptions = {}): AvailabilitySaver {
  return async (id) => {
    await wait(AVAILABILITY_SAVE_DELAY_MS);
    if (failingIds.includes(id)) throw new Error("No se pudo guardar");
  };
}

/** Default saver of the products screen: simulated latency plus the mock failure rule. */
export const saveProductAvailability = createAvailabilitySaver();
