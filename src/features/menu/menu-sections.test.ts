import { describe, expect, it } from "vitest";
import {
  HOME_SECTION_LIMIT,
  formatOptionCount,
  getComboProducts,
  getFeaturedProducts,
  getMenuSections,
  limitSection,
} from "./menu-sections";

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

describe("getComboProducts", () => {
  it("returns every combo, in menu order", () => {
    expect(getComboProducts().map((product) => product.id)).toEqual([
      "combo-central",
      "combo-medialunas",
    ]);
  });
});

describe("limitSection", () => {
  const [cafes, , comidas] = getMenuSections("todos");

  it("caps a long section and flags that there is more", () => {
    const { visible, hasMore } = limitSection(cafes.products, HOME_SECTION_LIMIT);
    expect(HOME_SECTION_LIMIT).toBe(4);
    expect(visible).toEqual(cafes.products.slice(0, 4));
    expect(hasMore).toBe(true);
  });

  it("keeps a short section whole", () => {
    const { visible, hasMore } = limitSection(comidas.products, HOME_SECTION_LIMIT);
    expect(visible).toEqual(comidas.products);
    expect(hasMore).toBe(false);
  });

  it("does not flag a section that exactly fits", () => {
    expect(limitSection(cafes.products.slice(0, 4), 4).hasMore).toBe(false);
  });
});

describe("formatOptionCount", () => {
  it("pluralizes", () => {
    expect(formatOptionCount(1)).toBe("1 opción");
    expect(formatOptionCount(8)).toBe("8 opciones");
  });
});
