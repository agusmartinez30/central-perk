import type { SpaceId, TableLayout, VenueTable } from "@/mocks/service-day";

/** A table and its chairs on the 02 plan ("Mesa 01 · free": 150×132). */
export const TABLE_BOX = { width: 150, height: 132 } as const;

/**
 * Editable area of a space's plan (invented: the 02 export draws a 4×3 grid that ends at
 * 740×540). Tables always keep their whole box inside it.
 */
export const PLAN_SIZE = { width: 780, height: 620 } as const;

/** Dropped and keyboard-moved tables snap to an 8px grid. */
export const GRID_STEP = 8;

/** Shift + arrow moves five grid steps. */
export const LARGE_STEP = GRID_STEP * 5;

export type TableShape = TableLayout["shape"];
export type PlanPoint = { x: number; y: number };

export function snapToGrid(value: number, step = GRID_STEP): number {
  return Math.round(value / step) * step;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function clampToPlan({ x, y }: PlanPoint): PlanPoint {
  return {
    x: clamp(x, 0, PLAN_SIZE.width - TABLE_BOX.width),
    y: clamp(y, 0, PLAN_SIZE.height - TABLE_BOX.height),
  };
}

/** Two table boxes overlap when they share any area; touching edges is fine. */
export function boxesOverlap(a: PlanPoint, b: PlanPoint): boolean {
  return a.x < b.x + TABLE_BOX.width && b.x < a.x + TABLE_BOX.width && a.y < b.y + TABLE_BOX.height && b.y < a.y + TABLE_BOX.height;
}

function findOverlap(tables: readonly VenueTable[], spaceId: SpaceId, point: PlanPoint, ignoreId?: string) {
  return tables.find((table) => table.id !== ignoreId && table.spaceId === spaceId && boxesOverlap(table.layout, point));
}

const PLAN_COLUMNS = [38, 222, 406, 590];
const PLAN_FIRST_ROW = 64;
const PLAN_ROW_STEP = 172;

/**
 * Spot for a table joining a space: the first cell of the 02 4-column grid (row by row) that no
 * table of the space overlaps, then any free grid-snapped spot of the plan, then the top-left cell.
 */
export function getFreeLayout(tables: readonly VenueTable[], spaceId: SpaceId): TableLayout {
  const free = (point: PlanPoint) => !findOverlap(tables, spaceId, point);
  for (let y = PLAN_FIRST_ROW; y + TABLE_BOX.height <= PLAN_SIZE.height; y += PLAN_ROW_STEP) {
    for (const x of PLAN_COLUMNS) if (free({ x, y })) return { x, y, shape: "rect" };
  }
  for (let y = 0; y + TABLE_BOX.height <= PLAN_SIZE.height; y += GRID_STEP) {
    for (let x = 0; x + TABLE_BOX.width <= PLAN_SIZE.width; x += GRID_STEP) if (free({ x, y })) return { x, y, shape: "rect" };
  }
  return { x: PLAN_COLUMNS[0], y: PLAN_FIRST_ROW, shape: "rect" };
}

export type MoveResult =
  | { ok: true; layout: TableLayout }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "overlap"; layout: TableLayout; conflict: { id: string; label: string } };

/** Where a table dropped at `point` lands: snapped, clamped, and refused over another table. */
export function resolveMove(tables: readonly VenueTable[], id: string, point: PlanPoint): MoveResult {
  const table = tables.find((candidate) => candidate.id === id);
  if (!table) return { ok: false, reason: "missing" };
  const snapped = clampToPlan({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
  const layout: TableLayout = { ...snapped, shape: table.layout.shape };
  const conflict = findOverlap(tables, table.spaceId, snapped, table.id);
  if (conflict) return { ok: false, reason: "overlap", layout, conflict: { id: conflict.id, label: conflict.label } };
  return { ok: true, layout };
}

/** Saves the resolved position (bumping the version); unchanged tables when the move is refused. */
export function moveTable(
  tables: readonly VenueTable[],
  id: string,
  point: PlanPoint,
): { tables: readonly VenueTable[]; result: MoveResult; ok: boolean } {
  const result = resolveMove(tables, id, point);
  if (!result.ok) return { tables, result, ok: false };
  const { layout } = result;
  const current = tables.find((table) => table.id === id)!;
  if (current.layout.x === layout.x && current.layout.y === layout.y) return { tables, result, ok: true };
  return {
    tables: tables.map((table) => (table.id === id ? { ...table, layout, version: table.version + 1 } : table)),
    result,
    ok: true,
  };
}

export function setTableShape(tables: readonly VenueTable[], id: string, shape: TableShape): readonly VenueTable[] {
  const target = tables.find((table) => table.id === id);
  if (!target || target.layout.shape === shape) return tables;
  return tables.map((table) =>
    table.id === id ? { ...table, layout: { ...table.layout, shape }, version: table.version + 1 } : table,
  );
}
