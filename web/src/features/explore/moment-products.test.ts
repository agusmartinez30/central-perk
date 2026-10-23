import { describe, expect, it } from "vitest";
import { getMomentById } from "@/mocks/moments";
import { getMomentProducts, resolveFilterId } from "./moment-products";

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

describe("resolveFilterId", () => {
  const afternoon = getMomentById("para-merendar")!;

  it("keeps a valid filter id", () => {
    expect(resolveFilterId(breakfast, "combos")).toBe("combos");
  });

  it("falls back to the first filter when missing or unknown", () => {
    expect(resolveFilterId(breakfast, undefined)).toBe("todos");
    expect(resolveFilterId(breakfast, "nope")).toBe("todos");
    expect(resolveFilterId(afternoon, "combos")).toBe("todos");
  });

  it("ignores repeated query values", () => {
    expect(resolveFilterId(breakfast, ["combos", "huevos"])).toBe("todos");
  });

  it("falls back to todos for a moment without filters", () => {
    expect(resolveFilterId({ ...breakfast, filters: [] }, "combos")).toBe("todos");
  });
});
