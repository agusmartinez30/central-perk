import { describe, expect, it } from "vitest";
import { getCategoryById, getCategoryProducts } from "./category-products";

describe("getCategoryById", () => {
  it("finds a real category", () => {
    expect(getCategoryById("cafes")?.label).toBe("Cafés");
  });

  it("rejects Todos and unknown ids", () => {
    expect(getCategoryById("todos")).toBeUndefined();
    expect(getCategoryById("zzz")).toBeUndefined();
  });
});

describe("getCategoryProducts", () => {
  it("returns every product of the category, in menu order", () => {
    const products = getCategoryProducts("cafes");
    expect(products).toHaveLength(8);
    expect(products[0].id).toBe("cappuccino");
    expect(products.every((product) => product.category === "cafes")).toBe(true);
  });
});
