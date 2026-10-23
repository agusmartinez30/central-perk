import { describe, expect, it } from "vitest";
import { COLLECTIONS_HISTORY } from "@/mocks/collections";
import {
  collectionsReducer,
  createCollectionsState,
  getSelectedCollection,
  getVisibleCollections,
} from "./collections-state";

const { collections, today } = COLLECTIONS_HISTORY;
const initial = createCollectionsState(collections, today);

describe("createCollectionsState", () => {
  it("starts on today's most recent collections, first page, no filters", () => {
    expect(initial).toMatchObject({
      period: "today",
      query: "",
      method: "all",
      staff: "all",
      sort: "recent",
      page: 1,
    });
    const visible = getVisibleCollections(initial);
    expect(visible.items.map((item) => item.id)).toEqual(["COB-0026", "COB-0025", "COB-0024", "COB-0023", "COB-0022"]);
    expect(visible.periodCollections).toHaveLength(5);
  });
});

describe("collectionsReducer", () => {
  it("moves between pages and clamps the page to the results", () => {
    const week = collectionsReducer(initial, { type: "set-period", period: "last-7-days" });
    const second = collectionsReducer(week, { type: "set-page", page: 2 });
    expect(getVisibleCollections(second)).toMatchObject({ page: 2, from: 6, to: 10, total: collections.length });
    expect(getVisibleCollections(collectionsReducer(week, { type: "set-page", page: 99 })).page).toBe(6);
  });

  it("goes back to the first page whenever a filter, the search or the sort changes", () => {
    const paged = collectionsReducer(collectionsReducer(initial, { type: "set-period", period: "last-7-days" }), {
      type: "set-page",
      page: 3,
    });
    for (const action of [
      { type: "set-period", period: "yesterday" },
      { type: "set-query", query: "mesa" },
      { type: "set-method", method: "cash" },
      { type: "set-staff", staff: "Lucas" },
      { type: "set-sort", sort: "highest-amount" },
    ] as const) {
      expect(collectionsReducer(paged, action).page).toBe(1);
    }
  });

  it("keeps the metrics on the whole period while search and selects narrow the table", () => {
    const state = collectionsReducer(initial, { type: "set-method", method: "transfer" });
    const visible = getVisibleCollections(state);
    expect(visible.items.map((item) => item.id)).toEqual(["COB-0025", "COB-0022"]);
    expect(visible.periodCollections).toHaveLength(5);
  });

  it("clears the search and the selects but keeps the period", () => {
    const filtered = [
      { type: "set-period", period: "yesterday" },
      { type: "set-query", query: "Mesa 99" },
      { type: "set-method", method: "card" },
      { type: "set-staff", staff: "Mariana" },
    ] as const;
    const state = filtered.reduce(collectionsReducer, initial);
    expect(collectionsReducer(state, { type: "clear-filters" })).toMatchObject({
      period: "yesterday",
      query: "",
      method: "all",
      staff: "all",
      page: 1,
    });
  });
});

describe("selected collection", () => {
  it("starts without a selection unless one is given", () => {
    expect(getSelectedCollection(initial)).toBeNull();
    const selected = createCollectionsState(collections, today, { selectedId: "COB-0026" });
    expect(getSelectedCollection(selected)?.id).toBe("COB-0026");
  });

  it("opens the detail of a known collection and ignores unknown ids", () => {
    const opened = collectionsReducer(initial, { type: "open-detail", id: "COB-0024" });
    expect(getSelectedCollection(opened)?.id).toBe("COB-0024");
    expect(collectionsReducer(opened, { type: "open-detail", id: "COB-9999" })).toBe(opened);
  });

  it("closes the detail and keeps filters and page", () => {
    const state = [
      { type: "set-period", period: "last-7-days" },
      { type: "set-page", page: 2 },
      { type: "open-detail", id: "COB-0020" },
      { type: "close-detail" },
    ] as const;
    const closed = state.reduce(collectionsReducer, initial);
    expect(closed).toMatchObject({ selectedId: null, period: "last-7-days", page: 2 });
  });
});
