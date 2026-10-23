import { describe, expect, it } from "vitest";
import { CONSUMPTION_MOMENTS, PRODUCTS } from "@/mocks/service-day";
import {
  applyCategoryDraft,
  archiveCategory,
  countCategoryMoments,
  countCategoryProducts,
  createEmptyCategoryDraft,
  createMenuCategories,
  getActiveCategories,
  getArchiveImpact,
  getCategoryChanges,
  getCategoryMetrics,
  getCategoryRows,
  getCategoryStatus,
  moveCategory,
  reorderCategories,
  setCategoryVisibility,
  toCategoryDraft,
  validateCategoryDraft,
  type MenuCategory,
} from "./category-catalog";

const categories = createMenuCategories();
const moments = CONSUMPTION_MOMENTS;
const labels = (list: readonly MenuCategory[]) => getActiveCategories(list).map((category) => category.label);
const categoryOf = (list: readonly MenuCategory[], id: string) => {
  const found = list.find((category) => category.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};

describe("category counts", () => {
  it("derives product counts from the product assignments, ignoring archived products", () => {
    expect(countCategoryProducts(PRODUCTS, "cafes")).toBe(4);
    expect(countCategoryProducts(PRODUCTS, "licuados")).toBe(0);
    const archived = PRODUCTS.map((product) => (product.id === "cappuccino" ? { ...product, archived: true } : product));
    expect(countCategoryProducts(archived, "cafes")).toBe(3);
  });

  it("counts the moments that use the category as a filter", () => {
    expect(countCategoryMoments(moments, "cafes")).toBe(3);
    expect(countCategoryMoments(moments, "licuados")).toBe(1);
  });
});

describe("category list (08C)", () => {
  it("lists active categories in display order with derived counts and status", () => {
    const rows = getCategoryRows({ categories, products: PRODUCTS, moments, query: "" });
    expect(rows.map((row) => row.label)).toEqual([
      "Cafés",
      "Tostadas",
      "Panadería",
      "Postres",
      "Tostados",
      "Sándwiches",
      "Hamburguesas",
      "Bebidas",
      "Licuados",
    ]);
    expect(rows[0]).toMatchObject({
      productLabel: "4 productos",
      momentLabel: "3 momentos",
      status: "visible",
      statusLabel: "Visible",
      orderLabel: "01",
    });
    expect(rows.at(-1)).toMatchObject({
      productLabel: "0 productos",
      momentLabel: "1 momento",
      status: "empty",
      statusLabel: "Vacía",
      orderLabel: "09",
    });
  });

  it("searches names without accents or case", () => {
    const rows = getCategoryRows({ categories, products: PRODUCTS, moments, query: "  SANDW " });
    expect(rows.map((row) => row.label)).toEqual(["Sándwiches"]);
  });

  it("summarizes active, filled and empty categories", () => {
    expect(getCategoryMetrics(categories, PRODUCTS)).toEqual({ active: 9, withProducts: 8, empty: 1 });
    const hidden = setCategoryVisibility(categories, "postres", false);
    expect(getCategoryMetrics(hidden, PRODUCTS)).toEqual({ active: 8, withProducts: 8, empty: 1 });
  });

  it("shows hidden categories as hidden whatever their products", () => {
    const hidden = { ...categoryOf(categories, "cafes"), visible: false };
    expect(getCategoryStatus(hidden, 4)).toBe("hidden");
    expect(getCategoryStatus(categoryOf(categories, "cafes"), 4)).toBe("visible");
    expect(getCategoryStatus(categoryOf(categories, "licuados"), 0)).toBe("empty");
  });
});

describe("category ordering", () => {
  it("drags a category to a new position and renumbers the active ones", () => {
    const moved = reorderCategories(categories, "licuados", 0);
    expect(labels(moved).slice(0, 3)).toEqual(["Licuados", "Cafés", "Tostadas"]);
    expect(getActiveCategories(moved).map((category) => category.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("moves one step with the keyboard", () => {
    expect(labels(moveCategory(categories, "tostadas", -1)).slice(0, 2)).toEqual(["Tostadas", "Cafés"]);
  });
});

describe("category editor (08D)", () => {
  it("requires a unique name and limits its length", () => {
    const context = { categories, editingId: "cafes" };
    expect(validateCategoryDraft({ ...toCategoryDraft(categoryOf(categories, "cafes")) }, context)).toEqual({});
    expect(validateCategoryDraft({ ...createEmptyCategoryDraft(), label: "  " }, context).label).toBe(
      "Ingresá un nombre.",
    );
    expect(validateCategoryDraft({ ...createEmptyCategoryDraft(), label: "tostadas" }, context).label).toBe(
      "Ya existe una categoría con ese nombre.",
    );
    expect(validateCategoryDraft({ ...createEmptyCategoryDraft(), label: "x".repeat(31) }, context).label).toBe(
      "Usá hasta 30 caracteres.",
    );
    expect(
      validateCategoryDraft({ ...createEmptyCategoryDraft(), label: "Té", description: "x".repeat(121) }, context)
        .description,
    ).toBe("Usá hasta 120 caracteres.");
  });

  it("lets an archived name be reused", () => {
    const archived = archiveCategory(categories, "licuados");
    expect(validateCategoryDraft({ ...createEmptyCategoryDraft(), label: "Licuados" }, { categories: archived, editingId: null })).toEqual({});
  });

  it("lists the changed fields between the saved category and the draft", () => {
    const saved = toCategoryDraft(categoryOf(categories, "cafes"));
    expect(getCategoryChanges(saved, saved)).toEqual([]);
    expect(getCategoryChanges(saved, { ...saved, label: "Café", visible: false })).toEqual(["Nombre", "Visibilidad"]);
  });

  it("saves an edit in place and a new category at the end with a unique id", () => {
    const edited = applyCategoryDraft(categories, "cafes", { ...toCategoryDraft(categoryOf(categories, "cafes")), label: " Café " });
    expect(edited.id).toBe("cafes");
    expect(categoryOf(edited.categories, "cafes")).toMatchObject({ label: "Café", order: 1 });

    const created = applyCategoryDraft(categories, null, { ...createEmptyCategoryDraft(), label: "Té y tisanas" });
    expect(created.id).toBe("te-y-tisanas");
    expect(categoryOf(created.categories, "te-y-tisanas")).toMatchObject({ order: 10, visible: true, archived: false });
  });

  it("asks for confirmation before archiving a category in use", () => {
    expect(getArchiveImpact(4, 3)).toEqual({
      requiresConfirmation: true,
      message: "Esta categoría tiene 4 productos y 3 momentos activos. Archivarla no borra productos ni pedidos confirmados.",
    });
    expect(getArchiveImpact(1, 1).message).toBe(
      "Esta categoría tiene 1 producto y 1 momento activo. Archivarla no borra productos ni pedidos confirmados.",
    );
    expect(getArchiveImpact(0, 0)).toEqual({
      requiresConfirmation: false,
      message: "Esta categoría no tiene productos ni momentos activos.",
    });
  });

  it("archives without deleting and closes the gap in the order", () => {
    const archived = archiveCategory(categories, "tostadas");
    expect(archived).toHaveLength(categories.length);
    expect(categoryOf(archived, "tostadas").archived).toBe(true);
    expect(labels(archived)).not.toContain("Tostadas");
    expect(getActiveCategories(archived).map((category) => category.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
