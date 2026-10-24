import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import {
  GRID_STEP,
  PLAN_SIZE,
  TABLE_BOX,
  boxesOverlap,
  clampToPlan,
  getFreeLayout,
  moveTable,
  resolveMove,
  setTableShape,
  snapToGrid,
} from "./table-layout";

const tables = SERVICE_DAY.tables;
const table = (id: string, list: readonly VenueTable[] = tables) => list.find((candidate) => candidate.id === id)!;

describe("plan geometry", () => {
  it("snaps coordinates to the 8px grid", () => {
    expect(GRID_STEP).toBe(8);
    expect(snapToGrid(38)).toBe(40);
    expect(snapToGrid(35.9)).toBe(32);
    expect(snapToGrid(-3)).toBe(-0);
  });

  it("keeps the whole table box inside the plan", () => {
    expect(clampToPlan({ x: -40, y: 12 })).toEqual({ x: 0, y: 12 });
    expect(clampToPlan({ x: 9999, y: 9999 })).toEqual({
      x: PLAN_SIZE.width - TABLE_BOX.width,
      y: PLAN_SIZE.height - TABLE_BOX.height,
    });
  });

  it("detects overlapping 150×132 boxes; touching edges do not overlap", () => {
    expect(boxesOverlap({ x: 0, y: 0 }, { x: 149, y: 131 })).toBe(true);
    expect(boxesOverlap({ x: 0, y: 0 }, { x: 150, y: 0 })).toBe(false);
    expect(boxesOverlap({ x: 0, y: 0 }, { x: 0, y: 132 })).toBe(false);
  });

  it("fits every seeded table inside the plan", () => {
    for (const seeded of tables) expect(clampToPlan(seeded.layout)).toEqual({ x: seeded.layout.x, y: seeded.layout.y });
  });
});

describe("getFreeLayout", () => {
  it("finds the first free spot of a space, row by row", () => {
    expect(getFreeLayout(tables, "salon")).toEqual({ x: 38, y: 236, shape: "rect" });
    expect(getFreeLayout(tables, "barra")).toEqual({ x: 38, y: 64, shape: "rect" });
  });

  it("skips spots a moved table overlaps", () => {
    const moved = moveTable(tables, "tbl_07", { x: 60, y: 240 }).tables;
    expect(getFreeLayout(moved, "salon")).toEqual({ x: 222, y: 236, shape: "rect" });
  });

  const salonAt = (points: readonly { x: number; y: number }[]): VenueTable[] =>
    points.map(({ x, y }, index) => ({ ...table("tbl_01"), id: `t${index}`, number: 100 + index, layout: { x, y, shape: "rect" } }));
  const COLUMNS = [38, 222, 406, 590];

  it("falls back to a free grid-snapped spot off the 4×3 grid when every cell is taken", () => {
    // Rows at y 124 and 400 cover every cell, leaving a 144px band from y 256.
    const blocked = salonAt([124, 400].flatMap((y) => COLUMNS.map((x) => ({ x, y }))));
    expect(getFreeLayout(blocked, "salon")).toEqual({ x: 0, y: 256, shape: "rect" });
  });

  it("uses the top-left cell when the plan has no room left", () => {
    const full = salonAt([64, 236, 408].flatMap((y) => COLUMNS.map((x) => ({ x, y }))));
    expect(getFreeLayout(full, "salon")).toEqual({ x: 38, y: 64, shape: "rect" });
  });
});

describe("moving tables", () => {
  it("snaps and clamps the drop point, then saves the layout and bumps the version", () => {
    expect(resolveMove(tables, "tbl_01", { x: -13, y: 5 })).toEqual({ ok: true, layout: { x: 0, y: 8, shape: "rect" } });
    const result = moveTable(tables, "tbl_01", { x: -13, y: 5 });
    expect(result.ok).toBe(true);
    expect(table("tbl_01", result.tables)).toMatchObject({ layout: { x: 0, y: 8, shape: "rect" }, version: 5 });
  });

  it("refuses a drop over another table of the same space and names it", () => {
    const result = resolveMove(tables, "tbl_01", { x: 222, y: 64 });
    expect(result).toMatchObject({ ok: false, reason: "overlap", conflict: { id: "tbl_02", label: "Mesa 02" } });
    expect(moveTable(tables, "tbl_01", { x: 222, y: 64 }).tables).toBe(tables);
  });

  it("ignores tables of other spaces and the moved table itself", () => {
    // Mesa 05 (Terraza) sits at 38/236 on its own plan; Salón's Mesa 01 can take that spot.
    expect(resolveMove(tables, "tbl_01", { x: 40, y: 236 }).ok).toBe(true);
    expect(resolveMove(tables, "tbl_01", { x: 40, y: 64 }).ok).toBe(true);
  });

  it("refuses unknown tables and keeps unchanged positions as they are", () => {
    expect(resolveMove(tables, "nope", { x: 0, y: 0 })).toEqual({ ok: false, reason: "missing" });
    expect(moveTable(tables, "tbl_01", { x: 0, y: 0 }).tables).not.toBe(tables);
    const same = moveTable(tables, "tbl_02", { x: 222 + 2, y: 64 });
    expect(table("tbl_02", same.tables).layout).toEqual({ x: 224, y: 64, shape: "rect" });
  });
});

describe("setTableShape", () => {
  it("switches between rect and round, bumping the version", () => {
    const round = setTableShape(tables, "tbl_01", "round");
    expect(table("tbl_01", round)).toMatchObject({ layout: { x: 38, y: 64, shape: "round" }, version: 5 });
    expect(setTableShape(tables, "tbl_01", "rect")).toBe(tables);
  });
});
