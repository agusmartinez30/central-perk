import {
  GRID_STEP,
  LARGE_STEP,
  TABLE_BOX,
  clampToPlan,
  snapToGrid,
  type PlanPoint,
  type PlanSize,
  type ResizeHandle,
} from "@/features/venue/table-layout";

/** Pointer travel (screen px) below which a press is a click, not a drag. */
export const DRAG_THRESHOLD = 4;

/**
 * Where a dragged table is drawn: its origin plus the pointer delta converted to plan units at
 * the current zoom, snapped to the grid and kept inside the plan at the table's `size`.
 */
export function getDragPoint(
  origin: PlanPoint,
  start: PlanPoint,
  current: PlanPoint,
  scale: number,
  size: PlanSize = TABLE_BOX,
): PlanPoint {
  return clampToPlan(
    {
      x: snapToGrid(origin.x + (current.x - start.x) / scale),
      y: snapToGrid(origin.y + (current.y - start.y) / scale),
    },
    size,
  );
}

export function hasDragged(start: PlanPoint, current: PlanPoint): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= DRAG_THRESHOLD;
}

const ARROWS: Record<string, PlanPoint> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** Arrow keys move the focused table one grid step (Shift: five), kept inside the plan; null for other keys. */
export function getArrowMove(point: PlanPoint, key: string, shift: boolean, size: PlanSize = TABLE_BOX): PlanPoint | null {
  const direction = ARROWS[key];
  if (!direction) return null;
  const step = shift ? LARGE_STEP : GRID_STEP;
  return clampToPlan({ x: point.x + direction.x * step, y: point.y + direction.y * step }, size);
}

/** On-screen thickness of the grab zone along each border, in px. */
export const EDGE_GRAB = 14;
/** On-screen side of a corner grab zone, in px. */
export const CORNER_GRAB = 18;

export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

export const isEdgeHandle = (handle: ResizeHandle) => handle.length === 1;

/**
 * Grab zone of a resize handle inside a table box of `size`, in plan units: borders span the
 * whole side between the corners and straddle it; corners are centered on the corner. Sizes are
 * divided by the zoom `scale`, so the zones keep the same on-screen size at every zoom.
 */
export function getGrabZone(handle: ResizeHandle, size: PlanSize, scale: number) {
  const edge = EDGE_GRAB / scale;
  const corner = CORNER_GRAB / scale;
  const x = handle.includes("w") ? 0 : handle.includes("e") ? size.width : size.width / 2;
  const y = handle.includes("n") ? 0 : handle.includes("s") ? size.height : size.height / 2;
  if (!isEdgeHandle(handle)) return { left: x - corner / 2, top: y - corner / 2, width: corner, height: corner };
  const horizontal = handle === "n" || handle === "s";
  const width = horizontal ? Math.max(0, size.width - corner) : edge;
  const height = horizontal ? edge : Math.max(0, size.height - corner);
  return { left: x - width / 2, top: y - height / 2, width, height };
}
