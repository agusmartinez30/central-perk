import { deriveTable, type ServiceDay, type SpaceId, type VenueSpace, type VenueTable } from "@/mocks/service-day";
import type { ManagedTable } from "@/mocks/types";
import {
  BODY_INSET,
  CHAIR_SIDES,
  CHAIR_SIZES,
  TABLE_BOX,
  getChairRowLength,
  getSeatsBySide,
  type ChairSide,
  type PlanSize,
} from "@/features/venue/table-layout";
import { formatPrice } from "@/shared/lib/format-price";
import { filterTables } from "./tables-view";

export { TABLE_BOX };
export type { ChairSide };

/** Body of a table inside its box ("Mesa 01 · free": 120×110 at 15/8 in the 150×132 box). */
export function getTableBody({ width, height }: PlanSize): { x: number; y: number; width: number; height: number } {
  return {
    x: BODY_INSET.x,
    y: BODY_INSET.top,
    width: width - BODY_INSET.x * 2,
    height: height - BODY_INSET.top - BODY_INSET.bottom,
  };
}

/** Body of the default box, until every caller draws from the stored size. */
export const TABLE_BODY = getTableBody(TABLE_BOX);

export type Chair = { side: ChairSide; x: number; y: number; width: number; height: number };

const CHAIR_DEPTH = 7;

/** Places `count` chairs centered along a `length` px side. */
function spread(count: number, length: number, sizes: { single: number; several: number }): { offset: number; size: number }[] {
  const size = count === 1 ? sizes.single : sizes.several;
  const start = (length - getChairRowLength(count, sizes)) / 2;
  return Array.from({ length: count }, (_, index) => ({ offset: start + index * (size + CHAIR_SIZES.gap), size }));
}

/**
 * Chairs around a table box of `size` (150×132 by default) by capacity: seats go round-robin to
 * top, bottom, left and right, so two people sit face to face, four take every side and six
 * double the long sides. Each row is centered along its side, so a longer box spreads them out.
 */
export function getChairs(capacity: number, size: PlanSize = TABLE_BOX): Chair[] {
  const counts = getSeatsBySide(capacity);
  const chairs: Chair[] = [];
  for (const side of CHAIR_SIDES) {
    if (counts[side] === 0) continue;
    const horizontal = side === "top" || side === "bottom";
    const slots = horizontal
      ? spread(counts[side], size.width, CHAIR_SIZES.horizontal)
      : spread(counts[side], size.height, CHAIR_SIZES.vertical);
    for (const { offset, size: length } of slots) {
      chairs.push(
        horizontal
          ? { side, x: offset, y: side === "top" ? 0 : size.height - CHAIR_DEPTH, width: length, height: CHAIR_DEPTH }
          : { side, x: side === "left" ? 4 : size.width - 4 - CHAIR_DEPTH, y: offset, width: CHAIR_DEPTH, height: length },
      );
    }
  }
  return chairs;
}

/** "18 min" or "1 h 08 min" (the plan prefixes "◷"). */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Plan colors: white (free), brand wash (seated) or danger wash (bill requested). */
export type PlanTone = "free" | "occupied" | "bill";

export function getPlanTone(table: ManagedTable): PlanTone {
  if (table.status === "available") return "free";
  return table.status === "bill-requested" ? "bill" : "occupied";
}

export type PlanTable = {
  id: string;
  number: number;
  /** "M05". */
  code: string;
  label: string;
  tone: PlanTone;
  capacityLabel: string;
  /** Shared account of a seated table; null when free. */
  account: string | null;
  /** Time seated; null when free. */
  duration: string | null;
  x: number;
  y: number;
  /** Stored box size (body plus chairs). */
  width: number;
  height: number;
  shape: "rect" | "round";
  chairs: Chair[];
  /** False when the search does not find it (the plan dims it). */
  matches: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Tables of one space on the plan: layout and capacity from the 09 configuration, live state
 * from the service day board. Disabled tables (absent from the board) are left out.
 */
export function getSpacePlan(
  spaceId: SpaceId,
  config: readonly VenueTable[],
  live: readonly ManagedTable[],
  query: string,
): PlanTable[] {
  const matching = new Set(filterTables(live, { filter: "all", query }).map((table) => table.number));
  const plan: PlanTable[] = [];
  for (const table of [...config].sort((a, b) => a.number - b.number)) {
    const state = live.find((item) => item.number === table.number);
    if (table.spaceId !== spaceId || !table.enabled || !state) continue;
    const seated = state.status !== "available";
    plan.push({
      id: state.id,
      number: table.number,
      code: `M${pad(table.number)}`,
      label: table.label,
      tone: getPlanTone(state),
      capacityLabel: `${table.capacity} ${table.capacity === 1 ? "persona" : "personas"}`,
      account: seated ? formatPrice(state.accountTotal) : null,
      duration: seated && state.seatedMinutes !== undefined ? formatDuration(state.seatedMinutes) : null,
      x: table.layout.x,
      y: table.layout.y,
      width: table.layout.width,
      height: table.layout.height,
      shape: table.layout.shape,
      chairs: getChairs(table.capacity, table.layout),
      matches: matching.has(table.number),
    });
  }
  return plan;
}

/**
 * Live state of the enabled tables of the venue configuration (the shared store), by number:
 * sessions, accounts and kitchen come from the service day; a table with no session is free.
 */
export function getLiveTables(config: readonly VenueTable[], day: ServiceDay): ManagedTable[] {
  return config
    .filter((table) => table.enabled)
    .map((table) => table.number)
    .sort((a, b) => a - b)
    .map((number) => deriveTable(day, number));
}

export type SpaceTab = { id: SpaceId; name: string; count: number };

/** "Floor Tabs": every space with its enabled tables. */
export function getSpaceTabs(spaces: readonly VenueSpace[], config: readonly VenueTable[]): SpaceTab[] {
  return spaces.map((space) => ({
    id: space.id,
    name: space.name,
    count: config.filter((table) => table.spaceId === space.id && table.enabled).length,
  }));
}

export type PlanSummaryItem = { id: ManagedTable["status"]; label: string };

/** "Status Summary": "2 disponibles", "5 ocupadas", "5 solicitan cuenta" over every table. */
export function getPlanSummary(live: readonly ManagedTable[]): PlanSummaryItem[] {
  const count = (status: ManagedTable["status"]) => live.filter((table) => table.status === status).length;
  const available = count("available");
  const occupied = count("occupied");
  const bill = count("bill-requested");
  return [
    { id: "available", label: `${available} ${available === 1 ? "disponible" : "disponibles"}` },
    { id: "occupied", label: `${occupied} ${occupied === 1 ? "ocupada" : "ocupadas"}` },
    { id: "bill-requested", label: `${bill} ${bill === 1 ? "solicita cuenta" : "solicitan cuenta"}` },
  ];
}

/** "Zoom Controls": 60%–160% in 20% steps. */
export const ZOOM = { min: 0.6, max: 1.6, step: 0.2 } as const;

const round2 = (value: number) => Math.round(value * 100) / 100;
const clampZoom = (scale: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, scale));

export function zoomBy(scale: number, direction: 1 | -1): number {
  return round2(clampZoom(scale + direction * ZOOM.step));
}

export type PlanTransform = { scale: number; x: number; y: number };

/** "Fit View": the largest scale (within the limits) that shows every table (default box when unsized), centered. */
export function getFitTransform(
  positions: readonly { x: number; y: number; width?: number; height?: number }[],
  viewport: { width: number; height: number },
  padding = 24,
): PlanTransform {
  if (positions.length === 0) return { scale: 1, x: 0, y: 0 };
  const left = Math.min(...positions.map((item) => item.x));
  const top = Math.min(...positions.map((item) => item.y));
  const width = Math.max(...positions.map((item) => item.x + (item.width ?? TABLE_BOX.width))) - left;
  const height = Math.max(...positions.map((item) => item.y + (item.height ?? TABLE_BOX.height))) - top;
  const fit = Math.min((viewport.width - padding * 2) / width, (viewport.height - padding * 2) / height);
  const scale = clampZoom(Math.floor(fit * 100) / 100);
  return {
    scale,
    x: (viewport.width - width * scale) / 2 - left * scale,
    y: (viewport.height - height * scale) / 2 - top * scale,
  };
}

/** Zoom in or out one step keeping `point` (viewport px) under the cursor / center. */
export function zoomAround(transform: PlanTransform, direction: 1 | -1, point: { x: number; y: number }): PlanTransform {
  const scale = zoomBy(transform.scale, direction);
  if (scale === transform.scale) return transform;
  const ratio = scale / transform.scale;
  return {
    scale,
    x: round2(point.x - (point.x - transform.x) * ratio),
    y: round2(point.y - (point.y - transform.y) * ratio),
  };
}
