import { describe, expect, it } from "vitest";
import { VISIBILITY_SAVE_DELAY_MS, createVisibilitySaver } from "./visibility-save";

describe("visibility saver", () => {
  it("waits the simulated latency and resolves", async () => {
    const waits: number[] = [];
    const save = createVisibilitySaver({ wait: async (ms) => void waits.push(ms) });
    await expect(save("moment", "desayunar", false)).resolves.toBeUndefined();
    expect(waits).toEqual([VISIBILITY_SAVE_DELAY_MS]);
  });

  it("rejects the saves listed as failing", async () => {
    const save = createVisibilitySaver({ wait: async () => {}, failingKeys: ["category:postres"] });
    await expect(save("category", "postres", false)).rejects.toThrow("No se pudo guardar");
    await expect(save("moment", "postres", false)).resolves.toBeUndefined();
  });

  it("has no failing saves by default", async () => {
    const save = createVisibilitySaver({ wait: async () => {} });
    await expect(save("category", "cafes", false)).resolves.toBeUndefined();
  });
});
