import { describe, expect, it } from "vitest";
import { getMomentById } from "@/mocks/moments";
import { getMomentProducts } from "./moment-products";

const breakfast = getMomentById("para-desayunar")!;

describe("getMomentProducts", () => {
  it("returns every moment product, in order, for Todos", () => {
    const products = getMomentProducts(breakfast, "todos");
    expect(products).toHaveLength(8);
    expect(products.slice(0, 4).map((product) => product.id)).toEqual([
      "tostadas-de-campo",
      "huevos-revueltos",
      "croissant",
      "combo-central",
    ]);
  });

  it("narrows to the sub-filter products", () => {
    expect(getMomentProducts(breakfast, "combos").map((product) => product.id)).toEqual([
      "combo-central",
      "combo-medialunas",
    ]);
  });

  it("falls back to all products for an unknown filter", () => {
    expect(getMomentProducts(breakfast, "nope")).toHaveLength(8);
  });
});
