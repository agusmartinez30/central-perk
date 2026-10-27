/**
 * Floor plan of a space (admin 02): every table has a box (body plus chairs) on a fixed canvas.
 * Ported from `admin/src/features/venue/table-layout.ts`; the drag-handle maths stays in the admin.
 */

export const TABLE_SHAPES = ['rect', 'round'] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

export interface PlanPoint {
  x: number;
  y: number;
}
export interface PlanSize {
  width: number;
  height: number;
}
export type PlanRect = PlanPoint & PlanSize;

/** Top-left corner and size of the table's box in its space's plan, and its shape. */
export type TableLayout = PlanRect & { shape: TableShape };

/** What the placement rules need from a table. */
export interface PlacedTable {
  id: string;
  spaceId: string;
  layout: TableLayout;
}

/** Default box of a new table (150×132). */
export const TABLE_BOX = { width: 150, height: 132 } as const;

/** Editable area of every space's plan; tables keep their whole box inside it. */
export const PLAN_SIZE = { width: 780, height: 620 } as const;

/** Moved tables snap to an 8px grid. */
export const GRID_STEP = 8;

export function snapToGrid(value: number, step = GRID_STEP): number {
  return Math.round(value / step) * step;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps a box of `size` inside the plan. */
export function clampToPlan({ x, y }: PlanPoint, size: PlanSize): PlanPoint {
  return {
    x: clamp(x, 0, Math.max(0, PLAN_SIZE.width - size.width)),
    y: clamp(y, 0, Math.max(0, PLAN_SIZE.height - size.height)),
  };
}

/** Two boxes overlap when they share any area; touching edges is fine. */
export function boxesOverlap(a: PlanRect, b: PlanRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function findOverlap<Table extends PlacedTable>(tables: readonly Table[], spaceId: string, rect: PlanRect, ignoreId?: string) {
  return tables.find((table) => table.id !== ignoreId && table.spaceId === spaceId && boxesOverlap(table.layout, rect));
}

// Size

type ChairSide = 'top' | 'bottom' | 'left' | 'right';
const CHAIR_SIDES: readonly ChairSide[] = ['top', 'bottom', 'left', 'right'];

/** Seats go round-robin to top, bottom, left and right. */
export function getSeatsBySide(capacity: number): Record<ChairSide, number> {
  const counts: Record<ChairSide, number> = { top: 0, bottom: 0, left: 0, right: 0 };
  for (let seat = 0; seat < Math.max(0, capacity); seat += 1) counts[CHAIR_SIDES[seat % CHAIR_SIDES.length] ?? 'top'] += 1;
  return counts;
}

/** Chair lengths along a side: one 50/42px chair, or several 40/30px ones 10px apart. */
const CHAIR_SIZES = {
  horizontal: { single: 50, several: 40 },
  vertical: { single: 42, several: 30 },
  gap: 10,
} as const;

/** Margin between the box and the table body, where the chairs sit. */
const BODY_INSET = { x: 15, top: 8, bottom: 14 } as const;

/** Smallest box any table gets, whatever its seats. */
const MIN_BOX = { width: 96, height: 88 } as const;

function getChairRowLength(count: number, sizes: { single: number; several: number }): number {
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

// Placement

const PLAN_COLUMNS = [38, 222, 406, 590] as const;
const PLAN_FIRST_ROW = 64;
const PLAN_ROW_STEP = 172;

/**
 * Spot for a table joining a space: the first cell of the 4-column grid (row by row) that no
 * table of the space overlaps, then any free grid-snapped spot, then the top-left cell. New
 * tables get the default rectangular box.
 */
export function getFreeLayout(tables: readonly PlacedTable[], spaceId: string): TableLayout {
  const at = (x: number, y: number): TableLayout => ({ x, y, ...TABLE_BOX, shape: 'rect' });
  const free = (x: number, y: number) => !findOverlap(tables, spaceId, at(x, y));
  for (let y = PLAN_FIRST_ROW; y + TABLE_BOX.height <= PLAN_SIZE.height; y += PLAN_ROW_STEP) {
    for (const x of PLAN_COLUMNS) if (free(x, y)) return at(x, y);
  }
  for (let y = 0; y + TABLE_BOX.height <= PLAN_SIZE.height; y += GRID_STEP) {
    for (let x = 0; x + TABLE_BOX.width <= PLAN_SIZE.width; x += GRID_STEP) if (free(x, y)) return at(x, y);
  }
  return at(PLAN_COLUMNS[0], PLAN_FIRST_ROW);
}

export type LayoutResult<Table extends PlacedTable> =
  | { ok: true; layout: TableLayout }
  | { ok: false; layout: TableLayout; conflict: Table };

function checkOverlap<Table extends PlacedTable>(tables: readonly Table[], table: PlacedTable, layout: TableLayout): LayoutResult<Table> {
  const conflict = findOverlap(tables, table.spaceId, layout, table.id);
  return conflict ? { ok: false, layout, conflict } : { ok: true, layout };
}

/** Where a table dropped at `point` lands: snapped, clamped at its size, refused over another table of its space. */
export function resolveMove<Table extends PlacedTable>(tables: readonly Table[], table: PlacedTable, point: PlanPoint): LayoutResult<Table> {
  const snapped = clampToPlan({ x: snapToGrid(point.x), y: snapToGrid(point.y) }, table.layout);
  return checkOverlap(tables, table, { ...table.layout, ...snapped });
}

/** Where a table resized to `rect` lands: at least its chairs' minimum, inside the plan, refused over another table. */
export function resolveResize<Table extends PlacedTable>(
  tables: readonly Table[],
  table: PlacedTable & { capacity: number },
  rect: PlanRect,
): LayoutResult<Table> {
  const min = getMinTableSize(table.capacity);
  const size = {
    width: clamp(Math.round(rect.width), min.width, PLAN_SIZE.width),
    height: clamp(Math.round(rect.height), min.height, PLAN_SIZE.height),
  };
  return checkOverlap(tables, table, { ...table.layout, ...clampToPlan(rect, size), ...size });
}

export function sameLayout(a: TableLayout, b: TableLayout): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height && a.shape === b.shape;
}
