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
  getMomentMetricItems,
  getMomentProductIds,
  getMomentProductSummary,
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
    expect(getMomentMetricItems(hidden, PRODUCTS)[1]).toEqual({ label: "Visibles", value: 3, detail: "En la carta digital" });
  });

  it("builds the metric strip: moments, visible ones and distinct assigned products", () => {
    expect(getMomentMetricItems(moments, PRODUCTS)).toEqual([
      { label: "Momentos", value: 4, detail: "Total configurados" },
      { label: "Visibles", value: 4, detail: "En la carta digital" },
      { label: "Productos asignados", value: 13, detail: "Entre los 4 momentos" },
    ]);
    // A product in several moments counts once; archived products and orphan moment ids do not count.
    const changed = PRODUCTS.map((product) =>
      product.id === "limonada" ? { ...product, archived: true } : product.id === "cheesecake" ? { ...product, moments: ["brunch"] } : product,
    );
    expect(getMomentMetricItems(moments.slice(0, 1), changed)[2]).toEqual({
      label: "Productos asignados",
      value: 7,
      detail: "En 1 momento",
    });
    expect(getMomentMetricItems(moments, changed)[2].value).toBe(11);
  });

  it("summarizes a moment's products and how many the menu shows", () => {
    expect(getMomentProductSummary(getMomentProductIds(PRODUCTS, "desayunar"), PRODUCTS)).toBe(
      "7 productos · 7 visibles en la carta",
    );
    // Cheesecake is a draft: associated but not in the menu.
    expect(getMomentProductSummary(getMomentProductIds(PRODUCTS, "merendar"), PRODUCTS)).toBe(
      "9 productos · 8 visibles en la carta",
    );
    expect(getMomentProductSummary(["cheesecake"], PRODUCTS)).toBe("1 producto · 0 visibles en la carta");
    expect(getMomentProductSummary(["limonada"], PRODUCTS)).toBe("1 producto · 1 visible en la carta");
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

  it("lists associated products with their photo, category and availability", () => {
    const rows = getAssociatedProducts(
      addDraftProduct(toMomentDraft(momentOf(moments, "cenar"), PRODUCTS), "limonada"),
      PRODUCTS,
      categories,
    );
    expect(rows.map((row) => [row.name, row.categoryLabel, row.availabilityLabel])).toEqual([
      ["Tostado clásico", "Tostados", "Disponible"],
      ["Tostado de jamón y queso", "Tostados", "Disponible"],
      ["Sándwich de pollo", "Sándwiches", "Disponible"],
      ["Hamburguesa clásica", "Hamburguesas", "No disponible"],
      ["Limonada", "Bebidas", "Disponible"],
    ]);
    expect(rows[0].image).toBe("/images/products/tostado-jamon-queso.webp");
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
    expect(preview.products[0]).toMatchObject({
      name: "Café con leche",
      description: "Espresso con leche caliente, servido en taza.",
      priceLabel: "$3.800",
      available: true,
    });
  });

  it("keeps unavailable published products listed as temporarily sold out", () => {
    const dinner = toMomentDraft(momentOf(moments, "cenar"), PRODUCTS);
    const preview = getExplorePreview(dinner, { products: PRODUCTS, categories }, "hamburguesas");
    expect(preview.products).toEqual([
      expect.objectContaining({ name: "Hamburguesa clásica", description: "Temporalmente agotado", available: false }),
    ]);
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
