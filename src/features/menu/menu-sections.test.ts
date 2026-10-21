import { describe, expect, it } from "vitest";
import { formatOptionCount, getFeaturedProducts, getMenuSections } from "./menu-sections";

describe("getMenuSections", () => {
  it("lists every non-empty category for Todos, in menu order", () => {
    const sections = getMenuSections("todos");
    expect(sections.map((section) => section.category.id)).toEqual([
      "cafes",
      "desayunos",
      "comidas",
      "bebidas",
      "postres",
    ]);
    expect(sections[0].products).toHaveLength(8);
  });

  it("returns only the selected category", () => {
    const sections = getMenuSections("postres");
    expect(sections).toHaveLength(1);
    expect(sections[0].products.every((product) => product.category === "postres")).toBe(true);
  });
});

describe("getFeaturedProducts", () => {
  it("returns the first two favorites", () => {
    expect(getFeaturedProducts().map((product) => product.id)).toEqual(["cappuccino", "medialunas"]);
  });
});

describe("formatOptionCount", () => {
  it("pluralizes", () => {
    expect(formatOptionCount(1)).toBe("1 opción");
    expect(formatOptionCount(8)).toBe("8 opciones");
  });
});
