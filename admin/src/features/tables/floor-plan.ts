import type { SpaceId, VenueSpace, VenueTable } from "@/mocks/service-day";
import type { ManagedTable } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import { filterTables } from "./tables-view";

/** A table and its chairs on the 02 plan ("Mesa 01 · free": 150×132, body 120×110 at 15/8). */
export const TABLE_BOX = { width: 150, height: 132 } as const;
export const TABLE_BODY = { x: 15, y: 8, width: 120, height: 110 } as const;

export type ChairSide = "top" | "bottom" | "left" | "right";
export type Chair = { side: ChairSide; x: number; y: number; width: number; height: number };

const SIDES: readonly ChairSide[] = ["top", "bottom", "left", "right"];
const CHAIR_DEPTH = 7;
const CHAIR_GAP = 10;

/** Places `count` chairs centered along a `length` px side: one 50/42px chair, or several 40/30px ones. */
function spread(count: number, length: number, single: number, several: number): { offset: number; size: number }[] {
  const size = count === 1 ? single : several;
  const total = count * size + (count - 1) * CHAIR_GAP;
  const start = (length - total) / 2;
  return Array.from({ length: count }, (_, index) => ({ offset: start + index * (size + CHAIR_GAP), size }));
}

/**
 * Chairs around a table by capacity: seats go round-robin to top, bottom, left and right, so
 * two people sit face to face, four take every side and six double the long sides.
 */
export function getChairs(capacity: number): Chair[] {
  const counts: Record<ChairSide, number> = { top: 0, bottom: 0, left: 0, right: 0 };
  for (let seat = 0; seat < Math.max(0, capacity); seat += 1) counts[SIDES[seat % SIDES.length]] += 1;
  const chairs: Chair[] = [];
  for (const side of SIDES) {
    if (counts[side] === 0) continue;
    const horizontal = side === "top" || side === "bottom";
    const slots = horizontal ? spread(counts[side], TABLE_BOX.width, 50, 40) : spread(counts[side], TABLE_BOX.height, 42, 30);
    for (const { offset, size } of slots) {
      chairs.push(
        horizontal
          ? { side, x: offset, y: side === "top" ? 0 : TABLE_BOX.height - CHAIR_DEPTH, width: size, height: CHAIR_DEPTH }
          : { side, x: side === "left" ? 4 : TABLE_BOX.width - 4 - CHAIR_DEPTH, y: offset, width: CHAIR_DEPTH, height: size },
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
      shape: table.layout.shape,
      chairs: getChairs(table.capacity),
      matches: matching.has(table.number),
    });
  }
  return plan;
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

/** "Fit View": the largest scale (within the limits) that shows every table, centered. */
export function getFitTransform(
  positions: readonly { x: number; y: number }[],
  viewport: { width: number; height: number },
  padding = 24,
): PlanTransform {
  if (positions.length === 0) return { scale: 1, x: 0, y: 0 };
  const left = Math.min(...positions.map((item) => item.x));
  const top = Math.min(...positions.map((item) => item.y));
  const width = Math.max(...positions.map((item) => item.x)) + TABLE_BOX.width - left;
  const height = Math.max(...positions.map((item) => item.y)) + TABLE_BOX.height - top;
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
