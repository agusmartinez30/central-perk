import { CATEGORIES, PRODUCTS } from "@/mocks/menu";
import type { Category, Product } from "@/mocks/types";

/** A real menu category by id; "todos" is a chip, not a category, so it is excluded. */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((category) => category.id !== "todos" && category.id === id);
}

/** Every product of a category, in menu order. */
export function getCategoryProducts(categoryId: Category["id"]): Product[] {
  return PRODUCTS.filter((product) => product.category === categoryId);
}
