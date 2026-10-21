import { describe, expect, it } from "vitest";
import { getDefaultChoiceIds, getProductById, getUnitPrice } from "./menu";

describe("getDefaultChoiceIds", () => {
  it("returns the preselected choice of each required group", () => {
    const cappuccino = getProductById("cappuccino")!;
    expect(getDefaultChoiceIds(cappuccino)).toEqual(["mediano", "entera"]);
  });

  it("returns no choices for products without options", () => {
    expect(getDefaultChoiceIds(getProductById("croissant")!)).toEqual([]);
  });

  it("prices the default configuration at the menu price", () => {
    const cappuccino = getProductById("cappuccino")!;
    expect(getUnitPrice(cappuccino, getDefaultChoiceIds(cappuccino))).toBe(cappuccino.price);
  });
});
