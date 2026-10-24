import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import {
  GRID_STEP,
  PLAN_SIZE,
  TABLE_BOX,
  boxesOverlap,
  clampToPlan,
  getFreeLayout,
  getMinTableSize,
  getResizedLayout,
  getSeatsBySide,
  moveTable,
  resizeTable,
  resolveMove,
  resolveResize,
  setTableShape,
  snapToGrid,
} from "./table-layout";

const BOX = { width: TABLE_BOX.width, height: TABLE_BOX.height };

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

  it("keeps a table of any size inside the plan", () => {
    expect(clampToPlan({ x: 9999, y: -5 }, { width: 200, height: 100 })).toEqual({ x: PLAN_SIZE.width - 200, y: 0 });
  });

  it("detects overlapping boxes of their own sizes; touching edges do not overlap", () => {
    const at = (x: number, y: number, width = 150, height = 132) => ({ x, y, width, height });
    expect(boxesOverlap(at(0, 0), at(149, 131))).toBe(true);
    expect(boxesOverlap(at(0, 0), at(150, 0))).toBe(false);
    expect(boxesOverlap(at(0, 0), at(0, 132))).toBe(false);
    expect(boxesOverlap(at(0, 0, 200), at(180, 0))).toBe(true);
    expect(boxesOverlap(at(0, 0, 100, 60), at(0, 60))).toBe(false);
  });

  it("fits every seeded table inside the plan at its stored size", () => {
    for (const seeded of tables) {
      const { x, y, width, height } = seeded.layout;
      expect(clampToPlan({ x, y }, { width, height })).toEqual({ x, y });
    }
  });

  it("gives the six-seat rectangular table of the seed a longer box", () => {
    expect(table("tbl_08").layout).toMatchObject({ shape: "rect", width: 184, height: 132 });
    expect(table("tbl_01").layout).toMatchObject(BOX);
  });
});

describe("getFreeLayout", () => {
  it("finds the first free spot of a space, row by row", () => {
    expect(getFreeLayout(tables, "salon")).toEqual({ x: 38, y: 236, shape: "rect", ...BOX });
    expect(getFreeLayout(tables, "barra")).toEqual({ x: 38, y: 64, shape: "rect", ...BOX });
  });

  it("skips spots a moved table overlaps", () => {
    const moved = moveTable(tables, "tbl_07", { x: 60, y: 240 }).tables;
    expect(getFreeLayout(moved, "salon")).toEqual({ x: 222, y: 236, shape: "rect", ...BOX });
  });

  const salonAt = (points: readonly { x: number; y: number }[]): VenueTable[] =>
    points.map(({ x, y }, index) => ({ ...table("tbl_01"), id: `t${index}`, number: 100 + index, layout: { x, y, shape: "rect", ...BOX } }));
  const COLUMNS = [38, 222, 406, 590];

  it("falls back to a free grid-snapped spot off the 4×3 grid when every cell is taken", () => {
    // Rows at y 124 and 400 cover every cell, leaving a 144px band from y 256.
    const blocked = salonAt([124, 400].flatMap((y) => COLUMNS.map((x) => ({ x, y }))));
    expect(getFreeLayout(blocked, "salon")).toEqual({ x: 0, y: 256, shape: "rect", ...BOX });
  });

  it("uses the top-left cell when the plan has no room left", () => {
    const full = salonAt([64, 236, 408].flatMap((y) => COLUMNS.map((x) => ({ x, y }))));
    expect(getFreeLayout(full, "salon")).toEqual({ x: 38, y: 64, shape: "rect", ...BOX });
  });
});

describe("moving tables", () => {
  it("snaps and clamps the drop point, then saves the layout and bumps the version", () => {
    expect(resolveMove(tables, "tbl_01", { x: -13, y: 5 })).toEqual({ ok: true, layout: { x: 0, y: 8, shape: "rect", ...BOX } });
    const result = moveTable(tables, "tbl_01", { x: -13, y: 5 });
    expect(result.ok).toBe(true);
    expect(table("tbl_01", result.tables)).toMatchObject({ layout: { x: 0, y: 8, shape: "rect", ...BOX }, version: 5 });
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
    expect(table("tbl_02", same.tables).layout).toEqual({ x: 224, y: 64, shape: "rect", ...BOX });
  });
});

describe("setTableShape", () => {
  it("switches between rect and round, bumping the version", () => {
    const round = setTableShape(tables, "tbl_01", "round");
    expect(table("tbl_01", round)).toMatchObject({ layout: { x: 38, y: 64, shape: "round", ...BOX }, version: 5 });
    expect(setTableShape(tables, "tbl_01", "rect")).toBe(tables);
  });
});

describe("table size limits", () => {
  it("spreads seats round-robin over top, bottom, left and right", () => {
    expect(getSeatsBySide(2)).toEqual({ top: 1, bottom: 1, left: 0, right: 0 });
    expect(getSeatsBySide(6)).toEqual({ top: 2, bottom: 2, left: 1, right: 1 });
    expect(getSeatsBySide(8)).toEqual({ top: 2, bottom: 2, left: 2, right: 2 });
  });

  it("never lets a table shrink below the room its chairs need", () => {
    expect(getMinTableSize(2)).toEqual({ width: 96, height: 88 });
    expect(getMinTableSize(4)).toEqual({ width: 96, height: 88 });
    expect(getMinTableSize(6)).toEqual({ width: 120, height: 88 });
    expect(getMinTableSize(8)).toEqual({ width: 120, height: 96 });
  });
});

describe("getResizedLayout", () => {
  const rect = { x: 38, y: 64, shape: "rect" as const, ...BOX };

  it("drags the east or south border: only that dimension grows, by grid steps", () => {
    expect(getResizedLayout(rect, 2, "e", 41, 50)).toEqual({ ...rect, width: 190 });
    expect(getResizedLayout(rect, 2, "s", 50, 30)).toEqual({ ...rect, height: 164 });
  });

  it("drags the west or north border keeping the opposite border fixed", () => {
    expect(getResizedLayout(rect, 2, "w", -21, 0)).toEqual({ ...rect, x: 14, width: 174 });
    expect(getResizedLayout(rect, 2, "n", 0, -100)).toEqual({ ...rect, y: 0, height: 196 });
  });

  it("drags a corner: both dimensions change", () => {
    expect(getResizedLayout(rect, 2, "se", 16, 16)).toEqual({ ...rect, width: 166, height: 148 });
    expect(getResizedLayout(rect, 2, "nw", -16, -16)).toEqual({ x: 22, y: 48, shape: "rect", width: 166, height: 148 });
  });

  it("stops at the minimum size for its seats", () => {
    expect(getResizedLayout(rect, 2, "e", -500, 0)).toMatchObject({ x: 38, width: 96 });
    expect(getResizedLayout(rect, 2, "w", 500, 0)).toMatchObject({ x: 92, width: 96 });
    expect(getResizedLayout(rect, 6, "e", -500, 0)).toMatchObject({ width: 120 });
  });

  it("stops at the plan borders", () => {
    expect(getResizedLayout(rect, 2, "e", 2000, 0)).toMatchObject({ width: PLAN_SIZE.width - 38 });
    expect(getResizedLayout(rect, 2, "s", 0, 2000)).toMatchObject({ height: PLAN_SIZE.height - 64 });
  });

  const round = { x: 222, y: 236, shape: "round" as const, ...BOX };

  it("keeps a round table's proportions from any border or corner", () => {
    expect(getResizedLayout(round, 4, "e", 48, 0)).toEqual({ ...round, width: 198, height: 174 });
    expect(getResizedLayout(round, 4, "s", 0, 44)).toEqual({ ...round, width: 198, height: 174 });
    expect(getResizedLayout(round, 4, "nw", -48, -10)).toEqual({ ...round, x: 174, y: 194, width: 198, height: 174 });
    expect(getResizedLayout(round, 4, "se", 8, 88)).toEqual({ ...round, width: 254, height: 224 });
  });

  it("keeps a round table above its minimum and inside the plan", () => {
    expect(getResizedLayout(round, 4, "e", -500, 0)).toEqual({ ...round, width: 100, height: 88 });
    const corner = { ...round, x: 38, y: 408 };
    expect(getResizedLayout(corner, 4, "nw", -48, 0)).toEqual({ ...corner, x: 0, y: 375, width: 188, height: 165 });
  });
});

describe("resizing tables", () => {
  const rectOf = (id: string) => table(id).layout;

  it("saves the new size and bumps the version", () => {
    const next = { ...rectOf("tbl_01"), width: 184 };
    expect(resolveResize(tables, "tbl_01", next)).toEqual({ ok: true, layout: next });
    const result = resizeTable(tables, "tbl_01", next);
    expect(result.ok).toBe(true);
    expect(table("tbl_01", result.tables)).toMatchObject({ layout: next, version: 5 });
  });

  it("refuses a size that covers another table of the space and names it", () => {
    const result = resolveResize(tables, "tbl_01", { ...rectOf("tbl_01"), width: 200 });
    expect(result).toMatchObject({ ok: false, reason: "overlap", conflict: { id: "tbl_02", label: "Mesa 02" } });
    expect(resizeTable(tables, "tbl_01", { ...rectOf("tbl_01"), width: 200 }).tables).toBe(tables);
  });

  it("re-checks the minimum size and the plan borders", () => {
    expect(resolveResize(tables, "tbl_01", { ...rectOf("tbl_01"), width: 40 })).toMatchObject({ ok: true, layout: { width: 96 } });
    expect(resolveResize(tables, "tbl_01", { ...rectOf("tbl_01"), height: 900 })).toMatchObject({
      ok: true,
      layout: { x: 38, y: 0, height: PLAN_SIZE.height },
    });
  });

  it("refuses unknown tables and keeps an unchanged size as it is", () => {
    expect(resolveResize(tables, "nope", { x: 0, y: 0, width: 150, height: 132 })).toEqual({ ok: false, reason: "missing" });
    expect(resizeTable(tables, "tbl_01", rectOf("tbl_01")).tables).toBe(tables);
  });
});
