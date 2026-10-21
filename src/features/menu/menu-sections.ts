import { CATEGORIES, PRODUCTS } from "@/mocks/menu";
import type { Category, CategoryId, Product } from "@/mocks/types";

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

export function formatOptionCount(count: number): string {
  return `${count} ${count === 1 ? "opción" : "opciones"}`;
}
