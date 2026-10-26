import { describe, expect, it } from "vitest";
import { getPageItems, paginate } from "./pagination";

describe("paginate / getPageItems", () => {
  const items = Array.from({ length: 12 }, (_, index) => index + 1);

  it("slices pages of five and clamps out-of-range pages", () => {
    expect(paginate(items, 1, 5)).toEqual({ items: [1, 2, 3, 4, 5], page: 1, pageCount: 3, from: 1, to: 5, total: 12 });
    expect(paginate(items, 3, 5)).toMatchObject({ items: [11, 12], page: 3, from: 11, to: 12 });
    expect(paginate(items, 9, 5).page).toBe(3);
    expect(paginate([], 2, 5)).toEqual({ items: [], page: 1, pageCount: 1, from: 0, to: 0, total: 0 });
  });

  it("lists the page buttons with an ellipsis", () => {
    expect(getPageItems(1, 26)).toEqual([1, 2, 3, "ellipsis", 26]);
    expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(13, 26)).toEqual([1, "ellipsis", 12, 13, 14, "ellipsis", 26]);
    expect(getPageItems(26, 26)).toEqual([1, "ellipsis", 24, 25, 26]);
    expect(getPageItems(1, 1)).toEqual([1]);
  });
});
