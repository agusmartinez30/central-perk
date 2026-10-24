import { GRID_STEP, LARGE_STEP, clampToPlan, snapToGrid, type PlanPoint } from "@/features/venue/table-layout";

/** Pointer travel (screen px) below which a press is a click, not a drag. */
export const DRAG_THRESHOLD = 4;

/**
 * Where a dragged table is drawn: its origin plus the pointer delta converted to plan units at
 * the current zoom, snapped to the grid and kept inside the plan.
 */
export function getDragPoint(origin: PlanPoint, start: PlanPoint, current: PlanPoint, scale: number): PlanPoint {
  return clampToPlan({
    x: snapToGrid(origin.x + (current.x - start.x) / scale),
    y: snapToGrid(origin.y + (current.y - start.y) / scale),
  });
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
export function getArrowMove(point: PlanPoint, key: string, shift: boolean): PlanPoint | null {
  const direction = ARROWS[key];
  if (!direction) return null;
  const step = shift ? LARGE_STEP : GRID_STEP;
  return clampToPlan({ x: point.x + direction.x * step, y: point.y + direction.y * step });
}
