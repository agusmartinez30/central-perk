import { describe, expect, it } from "vitest";
import { getTrapTarget } from "./focus-trap";

describe("getTrapTarget", () => {
  it("wraps Tab from the last element to the first", () => {
    expect(getTrapTarget(4, 3, false)).toBe(0);
  });

  it("wraps Shift+Tab from the first element to the last", () => {
    expect(getTrapTarget(4, 0, true)).toBe(3);
  });

  it("lets the browser move focus between inner elements", () => {
    expect(getTrapTarget(4, 1, false)).toBeNull();
    expect(getTrapTarget(4, 2, true)).toBeNull();
  });

  it("pulls focus back in when it is outside the dialog", () => {
    expect(getTrapTarget(4, -1, false)).toBe(0);
    expect(getTrapTarget(4, -1, true)).toBe(3);
  });

  it("does nothing without focusable elements", () => {
    expect(getTrapTarget(0, -1, false)).toBeNull();
  });
});
