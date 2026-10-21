import { CATEGORIES, PRODUCTS } from "@/mocks/menu";
import type { Category, CategoryId, Product } from "@/mocks/types";

/** Products shown per category section on the home (Todos) before "Ver más". */
export const HOME_SECTION_LIMIT = 4;

export type MenuSection = {
  category: Category;
  products: Product[];
};

/** Category sections for the menu list; "todos" shows every non-empty category. */
export function getMenuSections(categoryId: CategoryId): MenuSection[] {
  return CATEGORIES.filter((category) => category.id !== "todos")
    .filter((category) => categoryId === "todos" || category.id === categoryId)
    .map((category) => ({
      category,
      products: PRODUCTS.filter((product) => product.category === category.id),
    }))
    .filter((section) => section.products.length > 0);
}

/** Products highlighted in "Los favoritos del café". */
export function getFeaturedProducts(limit = 2): Product[] {
  return PRODUCTS.filter((product) => product.badge === "Favorito").slice(0, limit);
}

/** Products shown in the home "Combos" section. */
export function getComboProducts(): Product[] {
  return PRODUCTS.filter((product) => product.badge === "Combo");
}

/** First `limit` products of a section, and whether some were left out. */
export function limitSection(
  products: Product[],
  limit: number,
): { visible: Product[]; hasMore: boolean } {
  return { visible: products.slice(0, limit), hasMore: products.length > limit };
}

export function formatOptionCount(count: number): string {
  return `${count} ${count === 1 ? "opción" : "opciones"}`;
}
