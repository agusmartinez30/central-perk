import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import { archiveCategory, createMenuCategories, setCategoryVisibility } from "@/features/categories/category-catalog";
import {
  addDraftCategory,
  addDraftProduct,
  applyMomentDraft,
  createEmptyMomentDraft,
  createMenuMoments,
  getAssociatedProducts,
  getExplorePreview,
  getMomentCards,
  getMomentChanges,
  getMomentMetrics,
  getMomentProductIds,
  moveMoment,
  removeDraftCategory,
  removeDraftProduct,
  reorderMoments,
  searchAssignableCategories,
  searchAssignableProducts,
  setMomentVisibility,
  toMomentDraft,
  validateMomentDraft,
  type MenuMoment,
} from "./moment-catalog";

const categories = createMenuCategories();
const moments = createMenuMoments();
const momentOf = (list: readonly MenuMoment[], id: string) => {
  const found = list.find((moment) => moment.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};
const breakfast = momentOf(moments, "desayunar");
const breakfastDraft = toMomentDraft(breakfast, PRODUCTS);

describe("moment products", () => {
  it("derives a moment's products from the product assignments", () => {
    expect(getMomentProductIds(PRODUCTS, "desayunar")).toEqual([
      "cappuccino",
      "cappuccino-grande",
      "cafe-latte",
      "cafe-con-leche",
      "jugo-naranja",
      "medialuna",
      "toston-palta",
    ]);
    expect(getMomentProductIds(PRODUCTS, "cenar")).toHaveLength(4);
  });
});

describe("moment cards (08A)", () => {
  it("shows derived counts, the associated categories and the display order", () => {
    const cards = getMomentCards({ moments, products: PRODUCTS, categories });
    expect(cards.map((card) => card.title)).toEqual(["Para desayunar", "Para merendar", "Para cenar", "Para tomar"]);
    expect(cards[0]).toMatchObject({
      productLabel: "7 productos",
      categoryLabel: "4 categorías",
      categorySummary: "Cafés · Tostadas · Panadería · Bebidas",
      orderLabel: "Orden 1",
      visibilityLabel: "Visible",
    });
    expect(cards[3]).toMatchObject({ productLabel: "3 productos", orderLabel: "Orden 4" });
  });

  it("drops archived categories from the summary and the count", () => {
    const cards = getMomentCards({ moments, products: PRODUCTS, categories: archiveCategory(categories, "tostadas") });
    expect(cards[0]).toMatchObject({ categoryLabel: "3 categorías", categorySummary: "Cafés · Panadería · Bebidas" });
  });

  it("marks hidden moments and keeps them in the list", () => {
    const hidden = setMomentVisibility(moments, "cenar", false);
    const cards = getMomentCards({ moments: hidden, products: PRODUCTS, categories });
    expect(cards[2]).toMatchObject({ visible: false, visibilityLabel: "Oculto" });
    expect(getMomentMetrics(hidden, categories)).toEqual({ visibleMoments: 3, activeCategories: 9, totalCategories: 9 });
  });

  it("counts visible, active and total categories", () => {
    expect(getMomentMetrics(moments, categories)).toEqual({ visibleMoments: 4, activeCategories: 9, totalCategories: 9 });
    const changed = archiveCategory(setCategoryVisibility(categories, "postres", false), "licuados");
    expect(getMomentMetrics(moments, changed)).toEqual({ visibleMoments: 4, activeCategories: 7, totalCategories: 8 });
  });

  it("reorders moments by dragging or one step at a time", () => {
    expect(reorderMoments(moments, "tomar", 0).map((moment) => [moment.id, moment.order])).toEqual([
      ["tomar", 1],
      ["desayunar", 2],
      ["merendar", 3],
      ["cenar", 4],
    ]);
    expect(moveMoment(moments, "merendar", -1).map((moment) => moment.id)).toEqual([
      "merendar",
      "desayunar",
      "cenar",
      "tomar",
    ]);
  });
});

describe("moment editor (08B)", () => {
  it("adds and removes categories without touching the products", () => {
    const added = addDraftCategory(breakfastDraft, "postres");
    expect(added.categoryIds).toEqual(["cafes", "tostadas", "panaderia", "bebidas", "postres"]);
    expect(added.productIds).toEqual(breakfastDraft.productIds);
    expect(addDraftCategory(added, "postres")).toBe(added);
    expect(removeDraftCategory(added, "cafes").categoryIds).toEqual(["tostadas", "panaderia", "bebidas", "postres"]);
  });

  it("adds and removes products explicitly", () => {
    const added = addDraftProduct(breakfastDraft, "limonada");
    expect(added.productIds.at(-1)).toBe("limonada");
    expect(addDraftProduct(added, "limonada")).toBe(added);
    expect(removeDraftProduct(added, "cappuccino").productIds).not.toContain("cappuccino");
  });

  it("lists associated products with their availability", () => {
    const rows = getAssociatedProducts(addDraftProduct(toMomentDraft(momentOf(moments, "cenar"), PRODUCTS), "limonada"), PRODUCTS);
    expect(rows.map((row) => [row.name, row.availabilityLabel])).toEqual([
      ["Tostado clásico", "Disponible"],
      ["Tostado de jamón y queso", "Disponible"],
      ["Sándwich de pollo", "Disponible"],
      ["Hamburguesa clásica", "Agotado"],
      ["Limonada", "Disponible"],
    ]);
  });

  it("searches unassigned products and categories only", () => {
    expect(searchAssignableProducts(breakfastDraft, PRODUCTS, "tost").map((product) => product.name)).toEqual([
      "Tostado clásico",
      "Tostado de jamón y queso",
    ]);
    expect(searchAssignableProducts(breakfastDraft, PRODUCTS, " ")).toEqual([]);
    expect(searchAssignableCategories(breakfastDraft, categories, "").map((category) => category.label)).toEqual([
      "Postres",
      "Tostados",
      "Sándwiches",
      "Hamburguesas",
      "Licuados",
    ]);
    expect(searchAssignableCategories(breakfastDraft, categories, "lic").map((category) => category.id)).toEqual([
      "licuados",
    ]);
  });

  it("validates the name and the short description", () => {
    const context = { moments, editingId: "desayunar" };
    expect(validateMomentDraft(breakfastDraft, context)).toEqual({});
    expect(validateMomentDraft({ ...breakfastDraft, title: " ", description: "" }, context)).toEqual({
      title: "Ingresá un nombre.",
      description: "Ingresá una descripción breve.",
    });
    expect(validateMomentDraft({ ...breakfastDraft, title: "para MERENDAR" }, context).title).toBe(
      "Ya existe un momento con ese nombre.",
    );
    expect(validateMomentDraft({ ...breakfastDraft, title: "x".repeat(31) }, context).title).toBe("Usá hasta 30 caracteres.");
    expect(validateMomentDraft({ ...breakfastDraft, description: "x".repeat(61) }, context).description).toBe(
      "Usá hasta 60 caracteres.",
    );
  });

  it("lists the changed sections, ignoring association order", () => {
    expect(getMomentChanges(breakfastDraft, breakfastDraft)).toEqual([]);
    const reordered = { ...breakfastDraft, categoryIds: [...breakfastDraft.categoryIds].reverse() };
    expect(getMomentChanges(breakfastDraft, reordered)).toEqual([]);
    const changed = removeDraftProduct({ ...breakfastDraft, image: undefined, visible: false }, "cappuccino");
    expect(getMomentChanges(breakfastDraft, changed)).toEqual(["Portada", "Visibilidad", "Productos"]);
  });

  it("saves the moment and rewrites the product assignments", () => {
    const draft = removeDraftProduct(addDraftProduct({ ...breakfastDraft, title: " Para desayunar bien " }, "limonada"), "cappuccino");
    const saved = applyMomentDraft({ moments, products: PRODUCTS }, "desayunar", draft);
    expect(saved.id).toBe("desayunar");
    expect(momentOf(saved.moments, "desayunar")).toMatchObject({ title: "Para desayunar bien", order: 1 });
    expect(getMomentProductIds(saved.products, "desayunar")).toContain("limonada");
    expect(getMomentProductIds(saved.products, "desayunar")).not.toContain("cappuccino");
    expect(saved.products.find((product) => product.id === "cappuccino")?.moments).toEqual(["merendar"]);
  });

  it("creates a new moment at the end", () => {
    const draft = addDraftProduct({ ...createEmptyMomentDraft(), title: "Para el brunch", description: "Sin apuro." }, "toston-palta");
    const saved = applyMomentDraft({ moments, products: PRODUCTS }, null, draft);
    expect(saved.id).toBe("para-el-brunch");
    expect(momentOf(saved.moments, "para-el-brunch")).toMatchObject({ order: 5, visible: true, categoryIds: [] });
    expect(getMomentProductIds(saved.products, "para-el-brunch")).toEqual(["toston-palta"]);
  });
});

describe("explore preview (08E)", () => {
  it("shows Todos plus the non-empty visible category filters and the published products", () => {
    const preview = getExplorePreview(breakfastDraft, { products: PRODUCTS, categories }, "todos");
    expect(preview.title).toBe("Para desayunar");
    expect(preview.filters.map((filter) => [filter.label, filter.active])).toEqual([
      ["Todos", true],
      ["Cafés", false],
      ["Tostadas", false],
      ["Panadería", false],
      ["Bebidas", false],
    ]);
    expect(preview.countLabel).toBe("7 productos");
    expect(preview.products[0]).toMatchObject({ name: "Café con leche", priceLabel: "$3.800" });
  });

  it("filters by category", () => {
    const preview = getExplorePreview(breakfastDraft, { products: PRODUCTS, categories }, "tostadas");
    expect(preview.countLabel).toBe("1 producto");
    expect(preview.products.map((product) => product.name)).toEqual(["Tostón de palta"]);
  });

  it("hides empty, hidden and archived category filters and draft products", () => {
    const afternoon = toMomentDraft(momentOf(moments, "merendar"), PRODUCTS);
    const preview = getExplorePreview(afternoon, { products: PRODUCTS, categories }, "postres");
    expect(preview.filters.map((filter) => filter.label)).toEqual(["Todos", "Cafés", "Panadería", "Tostados"]);
    expect(preview.filters[0].active).toBe(true);
    expect(preview.products.map((product) => product.name)).not.toContain("Cheesecake");

    const changed = archiveCategory(setCategoryVisibility(categories, "cafes", false), "tostados");
    const filtered = getExplorePreview(afternoon, { products: PRODUCTS, categories: changed }, "todos");
    expect(filtered.filters.map((filter) => filter.label)).toEqual(["Todos", "Panadería"]);
    expect(filtered.countLabel).toBe("8 productos");
  });
});
