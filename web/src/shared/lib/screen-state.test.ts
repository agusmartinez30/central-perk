import { describe, expect, it } from "vitest";
import { parseScreenState } from "./screen-state";

const ORDER_STATES = ["pending", "error", "closed"] as const;

describe("parseScreenState", () => {
  it("returns an allowed value", () => {
    expect(parseScreenState("error", ORDER_STATES)).toBe("error");
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(parseScreenState("  Closed ", ORDER_STATES)).toBe("closed");
  });

  it("returns null for missing, empty or unknown values", () => {
    expect(parseScreenState(null, ORDER_STATES)).toBeNull();
    expect(parseScreenState(undefined, ORDER_STATES)).toBeNull();
    expect(parseScreenState("", ORDER_STATES)).toBeNull();
    expect(parseScreenState("offline", ORDER_STATES)).toBeNull();
  });
});
