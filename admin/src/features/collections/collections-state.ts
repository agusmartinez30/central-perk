import type { ManagedCollection } from "@/mocks/types";
import {
  filterCollections,
  getPeriodRange,
  paginate,
  sortCollections,
  type CollectionPeriod,
  type CollectionSort,
  type DateRange,
  type MethodFilter,
  type Page,
  type StaffFilter,
} from "./collections-view";

/** In-memory state of 05: the loaded collections, filters, sort and page. */
export type CollectionsState = {
  collections: ManagedCollection[];
  /** ISO date "Hoy" refers to. */
  today: string;
  period: CollectionPeriod;
  query: string;
  method: MethodFilter;
  staff: StaffFilter;
  sort: CollectionSort;
  page: number;
};

export type CollectionsAction =
  | { type: "set-period"; period: CollectionPeriod }
  | { type: "set-query"; query: string }
  | { type: "set-method"; method: MethodFilter }
  | { type: "set-staff"; staff: StaffFilter }
  | { type: "set-sort"; sort: CollectionSort }
  | { type: "set-page"; page: number }
  | { type: "clear-filters" };

export function createCollectionsState(
  collections: ManagedCollection[],
  today: string,
  overrides: Partial<Omit<CollectionsState, "collections" | "today">> = {},
): CollectionsState {
  return {
    collections,
    today,
    period: "today",
    query: "",
    method: "all",
    staff: "all",
    sort: "recent",
    page: 1,
    ...overrides,
  };
}

/**
 * Pure transitions of the collections history. Every change to the period, search, selects or
 * sort goes back to the first page; "clear-filters" keeps the period.
 */
export function collectionsReducer(state: CollectionsState, action: CollectionsAction): CollectionsState {
  switch (action.type) {
    case "set-period":
      return { ...state, period: action.period, page: 1 };
    case "set-query":
      return { ...state, query: action.query, page: 1 };
    case "set-method":
      return { ...state, method: action.method, page: 1 };
    case "set-staff":
      return { ...state, staff: action.staff, page: 1 };
    case "set-sort":
      return { ...state, sort: action.sort, page: 1 };
    case "set-page":
      return { ...state, page: action.page };
    case "clear-filters":
      return { ...state, query: "", method: "all", staff: "all", page: 1 };
  }
}

export type VisibleCollections = Page<ManagedCollection> & {
  range: DateRange;
  /** Every collection of the period: the metrics and the staff select ignore search and selects. */
  periodCollections: ManagedCollection[];
};

/** The current table page plus what the metrics and filters need. */
export function getVisibleCollections(state: CollectionsState): VisibleCollections {
  const range = getPeriodRange(state.period, state.today);
  const periodCollections = filterCollections(state.collections, { range, method: "all", staff: "all", query: "" });
  const matching = filterCollections(periodCollections, {
    range,
    method: state.method,
    staff: state.staff,
    query: state.query,
  });
  return { ...paginate(sortCollections(matching, state.sort), state.page), range, periodCollections };
}
