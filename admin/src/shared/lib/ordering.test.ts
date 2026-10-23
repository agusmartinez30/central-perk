import { describe, expect, it } from "vitest";
import { formatOrderNumber, moveByStep, moveToIndex, nextOrder, renumber, sortByOrder } from "./ordering";

const items = [
  { id: "c", order: 3 },
  { id: "a", order: 1 },
  { id: "b", order: 2 },
];

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

describe("ordering", () => {
  it("sorts by display order without mutating the input", () => {
    expect(ids(sortByOrder(items))).toEqual(["a", "b", "c"]);
    expect(ids(items)).toEqual(["c", "a", "b"]);
  });

  it("renumbers from 1 after gaps", () => {
    expect(renumber([{ id: "x", order: 7 }, { id: "y", order: 2 }])).toEqual([
      { id: "y", order: 1 },
      { id: "x", order: 2 },
    ]);
  });

  it("moves an item to an index and renumbers every item", () => {
    expect(moveToIndex(items, "c", 0)).toEqual([
      { id: "c", order: 1 },
      { id: "a", order: 2 },
      { id: "b", order: 3 },
    ]);
    expect(ids(moveToIndex(items, "a", 2))).toEqual(["b", "c", "a"]);
  });

  it("clamps the target index and ignores unknown ids", () => {
    expect(ids(moveToIndex(items, "a", 99))).toEqual(["b", "c", "a"]);
    expect(ids(moveToIndex(items, "b", -4))).toEqual(["b", "a", "c"]);
    expect(moveToIndex(items, "zzz", 0)).toEqual(renumber(items));
  });

  it("moves one step up or down, staying put at the edges", () => {
    expect(ids(moveByStep(items, "b", -1))).toEqual(["b", "a", "c"]);
    expect(ids(moveByStep(items, "b", 1))).toEqual(["a", "c", "b"]);
    expect(ids(moveByStep(items, "a", -1))).toEqual(["a", "b", "c"]);
    expect(ids(moveByStep(items, "c", 1))).toEqual(["a", "b", "c"]);
  });

  it("appends after the last order", () => {
    expect(nextOrder(items)).toBe(4);
    expect(nextOrder([])).toBe(1);
  });

  it("pads the 08C order column to two digits", () => {
    expect(formatOrderNumber(1)).toBe("01");
    expect(formatOrderNumber(12)).toBe("12");
  });
});
