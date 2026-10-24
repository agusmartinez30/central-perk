import { describe, expect, it } from "vitest";
import { PLAN_SIZE, TABLE_BOX } from "@/features/venue/table-layout";
import { getArrowMove, getDragPoint, hasDragged } from "./plan-drag";

describe("getDragPoint", () => {
  it("turns the pointer delta into plan units at the current zoom, snapped to the grid", () => {
    expect(getDragPoint({ x: 38, y: 64 }, { x: 100, y: 100 }, { x: 150, y: 90 }, 1)).toEqual({ x: 88, y: 56 });
    expect(getDragPoint({ x: 38, y: 64 }, { x: 100, y: 100 }, { x: 150, y: 90 }, 0.5)).toEqual({ x: 136, y: 48 });
  });

  it("keeps the table inside the plan", () => {
    expect(getDragPoint({ x: 38, y: 64 }, { x: 0, y: 0 }, { x: -500, y: 5000 }, 1)).toEqual({
      x: 0,
      y: PLAN_SIZE.height - TABLE_BOX.height,
    });
  });
});

describe("hasDragged", () => {
  it("ignores pointer jitter under 4px so a click still selects", () => {
    expect(hasDragged({ x: 10, y: 10 }, { x: 12, y: 12 })).toBe(false);
    expect(hasDragged({ x: 10, y: 10 }, { x: 14, y: 10 })).toBe(true);
  });
});

describe("getArrowMove", () => {
  it("moves one 8px grid step, or five with Shift", () => {
    expect(getArrowMove({ x: 40, y: 64 }, "ArrowRight", false)).toEqual({ x: 48, y: 64 });
    expect(getArrowMove({ x: 40, y: 64 }, "ArrowUp", true)).toEqual({ x: 40, y: 24 });
    expect(getArrowMove({ x: 40, y: 64 }, "ArrowDown", false)).toEqual({ x: 40, y: 72 });
    expect(getArrowMove({ x: 40, y: 64 }, "ArrowLeft", true)).toEqual({ x: 0, y: 64 });
  });

  it("ignores other keys", () => {
    expect(getArrowMove({ x: 40, y: 64 }, "Enter", false)).toBeNull();
  });
});
