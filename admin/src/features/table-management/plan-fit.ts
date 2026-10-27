import { getFitTransform, type PlanTransform } from "@/features/tables/floor-plan";
import { PLAN_SIZE } from "@/features/venue/table-layout";

/** The whole editable area, so fitting shows the plan rather than only its tables. */
const PLAN_BOUNDS = [{ x: 0, y: 0, ...PLAN_SIZE }];

/** Gap kept between the editable area and the viewport border. */
const FIT_PADDING = 16;

/** Largest zoom (within the limits) that shows the whole editable area in `viewport`, centered. */
export function getPlanFitTransform(viewport: { width: number; height: number }): PlanTransform {
  return getFitTransform(PLAN_BOUNDS, viewport, FIT_PADDING);
}
