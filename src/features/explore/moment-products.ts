import { getProductById } from "@/mocks/menu";
import type { Moment, Product } from "@/mocks/types";

/** Products of a moment for the selected sub-filter; filters without ids show them all. */
export function getMomentProducts(moment: Moment, filterId: string): Product[] {
  const filter = moment.filters.find((item) => item.id === filterId);
  const ids = filter?.productIds ?? moment.productIds;
  return ids.flatMap((id) => {
    const product = getProductById(id);
    return product ? [product] : [];
  });
}

/** Sub-filter to open a moment with: a valid `?filter=` value, or the moment's first filter. */
export function resolveFilterId(moment: Moment, raw: string | string[] | undefined): string {
  const fallback = moment.filters[0]?.id ?? "todos";
  if (typeof raw !== "string") return fallback;
  return moment.filters.some((filter) => filter.id === raw) ? raw : fallback;
}
