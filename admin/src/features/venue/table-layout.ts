import type { SpaceId, TableLayout, VenueTable } from "@/mocks/service-day";

/** Default table box with its chairs on the 02 plan ("Mesa 01 · free": 150×132). */
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
export type PlanSize = { width: number; height: number };
export type PlanRect = PlanPoint & PlanSize;

export function snapToGrid(value: number, step = GRID_STEP): number {
  return Math.round(value / step) * step;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps a box of `size` (the default box when omitted) inside the plan. */
export function clampToPlan({ x, y }: PlanPoint, size: PlanSize = TABLE_BOX): PlanPoint {
  return {
    x: clamp(x, 0, Math.max(0, PLAN_SIZE.width - size.width)),
    y: clamp(y, 0, Math.max(0, PLAN_SIZE.height - size.height)),
  };
}

/** Two table boxes overlap when they share any area; touching edges is fine. */
export function boxesOverlap(a: PlanRect, b: PlanRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function findOverlap(tables: readonly VenueTable[], spaceId: SpaceId, rect: PlanRect, ignoreId?: string) {
  return tables.find((table) => table.id !== ignoreId && table.spaceId === spaceId && boxesOverlap(table.layout, rect));
}

// Size

export type ChairSide = "top" | "bottom" | "left" | "right";
export const CHAIR_SIDES: readonly ChairSide[] = ["top", "bottom", "left", "right"];

/** Seats go round-robin to top, bottom, left and right: two sit face to face, six double the long sides. */
export function getSeatsBySide(capacity: number): Record<ChairSide, number> {
  const counts: Record<ChairSide, number> = { top: 0, bottom: 0, left: 0, right: 0 };
  for (let seat = 0; seat < Math.max(0, capacity); seat += 1) counts[CHAIR_SIDES[seat % CHAIR_SIDES.length]] += 1;
  return counts;
}

/** Chair lengths along a side: one 50/42px chair, or several 40/30px ones 10px apart. */
export const CHAIR_SIZES = {
  horizontal: { single: 50, several: 40 },
  vertical: { single: 42, several: 30 },
  gap: 10,
} as const;

/** Margin between the box and the table body, where the chairs sit (15px sides, 8/14px top/bottom). */
export const BODY_INSET = { x: 15, top: 8, bottom: 14 } as const;

/** Smallest box any table gets, whatever its seats. */
const MIN_BOX = { width: 96, height: 88 } as const;

/** Length of `count` chairs in a row along one side. */
export function getChairRowLength(count: number, sizes: { single: number; several: number }): number {
  if (count <= 0) return 0;
  return count === 1 ? sizes.single : count * sizes.several + (count - 1) * CHAIR_SIZES.gap;
}

const snapUp = (value: number) => Math.ceil(value / GRID_STEP) * GRID_STEP;

/** Smallest box that still fits the table's chairs along every side. */
export function getMinTableSize(capacity: number): PlanSize {
  const seats = getSeatsBySide(capacity);
  const width = getChairRowLength(seats.top, CHAIR_SIZES.horizontal) + BODY_INSET.x * 2;
  const height = getChairRowLength(seats.left, CHAIR_SIZES.vertical) + BODY_INSET.top + BODY_INSET.bottom;
  return { width: snapUp(Math.max(MIN_BOX.width, width)), height: snapUp(Math.max(MIN_BOX.height, height)) };
}

/** Resize handle: a border (n, s, e, w) or a corner (ne, nw, se, sw). */
export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Every table offers every border and corner; corners come first so they win where zones meet. */
export const RESIZE_HANDLES: readonly ResizeHandle[] = ["n", "e", "s", "w", "nw", "ne", "se", "sw"];

/**
 * Box of `layout` (the snapshot taken when the drag started) after dragging `handle` by the
 * total pointer delta, in plan units. The delta snaps to the grid, so the box changes in 8px
 * steps and never drifts. West and north handles keep the opposite border fixed. Rectangles
 * change only the dragged border's dimension (corners change both); round tables resize from
 * any border or corner keeping their proportions. The box never goes below the chairs'
 * minimum nor outside the plan.
 */
export function getResizedLayout(
  layout: TableLayout,
  capacity: number,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): TableLayout {
  const min = getMinTableSize(capacity);
  const east = handle.includes("e");
  const west = handle.includes("w");
  const south = handle.includes("s");
  const north = handle.includes("n");
  const right = layout.x + layout.width;
  const bottom = layout.y + layout.height;

  if (layout.shape === "round") {
    const ratio = layout.height / layout.width;
    // Each axis the handle touches proposes a width change; the larger one wins.
    const alongX = east ? dx : west ? -dx : 0;
    const alongY = (south ? dy : north ? -dy : 0) / ratio;
    const delta = snapToGrid(Math.abs(alongX) >= Math.abs(alongY) ? alongX : alongY);
    const minWidth = Math.max(min.width, min.height / ratio);
    const roomX = west ? right : PLAN_SIZE.width - layout.x;
    const roomY = north ? bottom : PLAN_SIZE.height - layout.y;
    const maxWidth = Math.floor(Math.min(roomX, roomY / ratio));
    const width = clamp(layout.width + delta, minWidth, Math.max(minWidth, maxWidth));
    const height = Math.round(width * ratio);
    return { ...layout, x: west ? right - width : layout.x, y: north ? bottom - height : layout.y, width, height };
  }

  let { x, y, width, height } = layout;
  if (east) width = clamp(layout.width + snapToGrid(dx), min.width, Math.max(min.width, PLAN_SIZE.width - x));
  if (west) {
    x = clamp(layout.x + snapToGrid(dx), 0, Math.max(0, right - min.width));
    width = right - x;
  }
  if (south) height = clamp(layout.height + snapToGrid(dy), min.height, Math.max(min.height, PLAN_SIZE.height - y));
  if (north) {
    y = clamp(layout.y + snapToGrid(dy), 0, Math.max(0, bottom - min.height));
    height = bottom - y;
  }
  return { ...layout, x, y, width, height };
}

// Placement

const PLAN_COLUMNS = [38, 222, 406, 590];
const PLAN_FIRST_ROW = 64;
const PLAN_ROW_STEP = 172;

/**
 * Spot for a table joining a space: the first cell of the 02 4-column grid (row by row) that no
 * table of the space overlaps, then any free grid-snapped spot of the plan, then the top-left
 * cell. New tables get the default 150×132 box.
 */
export function getFreeLayout(tables: readonly VenueTable[], spaceId: SpaceId): TableLayout {
  const at = (x: number, y: number): TableLayout => ({ x, y, ...TABLE_BOX, shape: "rect" });
  const free = (x: number, y: number) => !findOverlap(tables, spaceId, at(x, y));
  for (let y = PLAN_FIRST_ROW; y + TABLE_BOX.height <= PLAN_SIZE.height; y += PLAN_ROW_STEP) {
    for (const x of PLAN_COLUMNS) if (free(x, y)) return at(x, y);
  }
  for (let y = 0; y + TABLE_BOX.height <= PLAN_SIZE.height; y += GRID_STEP) {
    for (let x = 0; x + TABLE_BOX.width <= PLAN_SIZE.width; x += GRID_STEP) if (free(x, y)) return at(x, y);
  }
  return at(PLAN_COLUMNS[0], PLAN_FIRST_ROW);
}

export type MoveResult =
  | { ok: true; layout: TableLayout }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "overlap"; layout: TableLayout; conflict: { id: string; label: string } };

function checkOverlap(tables: readonly VenueTable[], table: VenueTable, layout: TableLayout): MoveResult {
  const conflict = findOverlap(tables, table.spaceId, layout, table.id);
  if (conflict) return { ok: false, reason: "overlap", layout, conflict: { id: conflict.id, label: conflict.label } };
  return { ok: true, layout };
}

/** Where a table dropped at `point` lands: snapped, clamped at its size, and refused over another table. */
export function resolveMove(tables: readonly VenueTable[], id: string, point: PlanPoint): MoveResult {
  const table = tables.find((candidate) => candidate.id === id);
  if (!table) return { ok: false, reason: "missing" };
  const snapped = clampToPlan({ x: snapToGrid(point.x), y: snapToGrid(point.y) }, table.layout);
  return checkOverlap(tables, table, { ...table.layout, ...snapped });
}

/** Where a table resized to `rect` lands: at least its chairs' minimum, inside the plan, refused over another table. */
export function resolveResize(tables: readonly VenueTable[], id: string, rect: PlanRect): MoveResult {
  const table = tables.find((candidate) => candidate.id === id);
  if (!table) return { ok: false, reason: "missing" };
  const min = getMinTableSize(table.capacity);
  const size = {
    width: clamp(Math.round(rect.width), min.width, PLAN_SIZE.width),
    height: clamp(Math.round(rect.height), min.height, PLAN_SIZE.height),
  };
  return checkOverlap(tables, table, { ...table.layout, ...clampToPlan(rect, size), ...size });
}

const sameLayout = (a: TableLayout, b: TableLayout) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height && a.shape === b.shape;

type LayoutChange = { tables: readonly VenueTable[]; result: MoveResult; ok: boolean };

/** Saves a resolved layout (bumping the version); unchanged tables when it was refused or is the same. */
function saveLayout(tables: readonly VenueTable[], id: string, result: MoveResult): LayoutChange {
  if (!result.ok) return { tables, result, ok: false };
  const { layout } = result;
  const current = tables.find((table) => table.id === id)!;
  if (sameLayout(current.layout, layout)) return { tables, result, ok: true };
  return {
    tables: tables.map((table) => (table.id === id ? { ...table, layout, version: table.version + 1 } : table)),
    result,
    ok: true,
  };
}

/** Saves the resolved position (bumping the version); unchanged tables when the move is refused. */
export function moveTable(tables: readonly VenueTable[], id: string, point: PlanPoint): LayoutChange {
  return saveLayout(tables, id, resolveMove(tables, id, point));
}

/** Saves the resolved size (bumping the version); unchanged tables when the resize is refused. */
export function resizeTable(tables: readonly VenueTable[], id: string, rect: PlanRect): LayoutChange {
  return saveLayout(tables, id, resolveResize(tables, id, rect));
}

export function setTableShape(tables: readonly VenueTable[], id: string, shape: TableShape): readonly VenueTable[] {
  const target = tables.find((table) => table.id === id);
  if (!target || target.layout.shape === shape) return tables;
  return tables.map((table) =>
    table.id === id ? { ...table, layout: { ...table.layout, shape }, version: table.version + 1 } : table,
  );
}
