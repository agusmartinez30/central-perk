import { describe, expect, it } from "vitest";
import { PLAN_SIZE, TABLE_BOX } from "@/features/venue/table-layout";
import { RESIZE_CURSORS, getArrowMove, getDragPoint, getGrabZone, hasDragged } from "./plan-drag";

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

  it("keeps a resized table inside the plan at its own size", () => {
    const size = { width: 184, height: 200 };
    expect(getDragPoint({ x: 38, y: 64 }, { x: 0, y: 0 }, { x: 5000, y: 5000 }, 1, size)).toEqual({
      x: PLAN_SIZE.width - 184,
      y: PLAN_SIZE.height - 200,
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

  it("stops a resized table at the plan border", () => {
    expect(getArrowMove({ x: 592, y: 64 }, "ArrowRight", false, { width: 184, height: 132 })).toEqual({ x: 596, y: 64 });
  });

  it("ignores other keys", () => {
    expect(getArrowMove({ x: 40, y: 64 }, "Enter", false)).toBeNull();
  });
});

describe("getGrabZone", () => {
  const box = { width: 150, height: 132 };

  it("straddles each whole border between the corners, 14px thick on screen", () => {
    expect(getGrabZone("e", box, 1)).toEqual({ left: 143, top: 9, width: 14, height: 114 });
    expect(getGrabZone("n", box, 1)).toEqual({ left: 9, top: -7, width: 132, height: 14 });
    expect(getGrabZone("w", box, 1)).toEqual({ left: -7, top: 9, width: 14, height: 114 });
    expect(getGrabZone("s", box, 1)).toEqual({ left: 9, top: 125, width: 132, height: 14 });
  });

  it("centers an 18px square on each corner", () => {
    expect(getGrabZone("se", box, 1)).toEqual({ left: 141, top: 123, width: 18, height: 18 });
    expect(getGrabZone("nw", box, 1)).toEqual({ left: -9, top: -9, width: 18, height: 18 });
  });

  it("keeps the same on-screen size at any zoom", () => {
    expect(getGrabZone("e", box, 2)).toEqual({ left: 146.5, top: 4.5, width: 7, height: 123 });
  });
});

describe("RESIZE_CURSORS", () => {
  it("shows the resize direction of every border and corner", () => {
    expect(RESIZE_CURSORS).toEqual({
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      nw: "nwse-resize",
      se: "nwse-resize",
    });
  });
});
