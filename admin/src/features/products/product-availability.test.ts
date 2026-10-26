import { describe, expect, it, vi } from "vitest";
import { AVAILABILITY_SAVE_DELAY_MS, createAvailabilitySaver } from "./product-availability";

describe("createAvailabilitySaver", () => {
  it("waits the simulated latency and resolves", async () => {
    const wait = vi.fn(() => Promise.resolve());
    const save = createAvailabilitySaver({ wait, failingIds: [] });
    await expect(save("cappuccino", false)).resolves.toBeUndefined();
    expect(wait).toHaveBeenCalledWith(AVAILABILITY_SAVE_DELAY_MS);
  });

  it("rejects for the products the mock rule marks as failing", async () => {
    const save = createAvailabilitySaver({ wait: () => Promise.resolve(), failingIds: ["cheesecake"] });
    await expect(save("cheesecake", true)).rejects.toThrow("No se pudo guardar");
    await expect(save("limonada", true)).resolves.toBeUndefined();
  });

  it("fails for Cheesecake by default, as the 07A export shows", async () => {
    const save = createAvailabilitySaver({ wait: () => Promise.resolve() });
    await expect(save("cheesecake", true)).rejects.toThrow();
    await expect(save("cappuccino", false)).resolves.toBeUndefined();
  });
});
