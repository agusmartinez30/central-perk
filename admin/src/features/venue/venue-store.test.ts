import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchVenue, getServerVenueSnapshot, getVenueSnapshot, resetVenueStore, subscribeToVenue } from "./venue-store";

afterEach(() => resetVenueStore());

describe("venue store", () => {
  it("starts from the seed, the same snapshot the server renders", () => {
    expect(getVenueSnapshot()).toBe(getServerVenueSnapshot());
    expect(getVenueSnapshot().tables).toHaveLength(12);
  });

  it("applies actions, notifies subscribers and keeps the snapshot stable between changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToVenue(listener);
    const next = dispatchVenue({ type: "save-space", editingId: null, name: "Barra" });
    expect(next).toBe(getVenueSnapshot());
    expect(getVenueSnapshot().spaces.at(-1)?.id).toBe("barra");
    expect(getServerVenueSnapshot().spaces).toHaveLength(3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getVenueSnapshot()).toBe(getVenueSnapshot());
    unsubscribe();
    dispatchVenue({ type: "delete-space", id: "barra" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify when an action changes nothing", () => {
    const listener = vi.fn();
    subscribeToVenue(listener);
    dispatchVenue({ type: "delete-space", id: "patio" });
    expect(listener).not.toHaveBeenCalled();
  });
});
