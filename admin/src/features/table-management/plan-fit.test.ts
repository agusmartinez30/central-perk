import { describe, expect, it } from "vitest";
import { PLAN_SIZE } from "@/features/venue/table-layout";
import { ZOOM } from "@/features/tables/floor-plan";
import { getPlanFitTransform } from "./plan-fit";

describe("getPlanFitTransform", () => {
  it("scales the editable area up to fill a larger viewport, centered", () => {
    const viewport = { width: 1200, height: 700 };
    const { scale, x, y } = getPlanFitTransform(viewport);
    expect(scale).toBeGreaterThan(1);
    expect(PLAN_SIZE.height * scale).toBeLessThanOrEqual(viewport.height);
    expect(x).toBeCloseTo((viewport.width - PLAN_SIZE.width * scale) / 2);
    expect(y).toBeCloseTo((viewport.height - PLAN_SIZE.height * scale) / 2);
  });

  it("fills the width when the viewport is narrower than the plan's proportion", () => {
    const viewport = { width: 900, height: 1000 };
    const { scale, x } = getPlanFitTransform(viewport);
    expect(PLAN_SIZE.width * scale).toBeGreaterThan(viewport.width - 40);
    expect(x).toBeGreaterThanOrEqual(0);
  });

  it("never zooms out past the minimum zoom", () => {
    expect(getPlanFitTransform({ width: 300, height: 200 }).scale).toBe(ZOOM.min);
  });
});
