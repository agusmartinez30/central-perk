import { PRODUCT_CATEGORIES, type ProductCategoryInfo, type ProductPublication } from "@/mocks/service-day";
import { normalizeText } from "@/features/products/product-catalog";
import { formatOrderNumber, moveByStep, moveToIndex, nextOrder, renumber, sortByOrder } from "@/shared/lib/ordering";

/**
 * What 08 needs from a catalogue product. `Product` satisfies it; ids are plain strings because
 * categories and moments created in the session are not part of the canonical unions.
 */
export type CatalogProductRef = {
  id: string;
  name: string;
  price: number;
  image?: string;
  available: boolean;
  archived: boolean;
  publication: ProductPublication;
  categoryId: string;
  moments: readonly string[];
};

/** A category as edited in 08: the catalogue fields plus the session-only archive flag. */
export type MenuCategory = Omit<ProductCategoryInfo, "id"> & { id: string; archived: boolean };

export type CategoryStatus = "visible" | "empty" | "hidden";

/** 08C "Estado" chips: "Visible" and "Vacía" are in the export, "Oculta" is invented. */
export const CATEGORY_STATUS_LABELS: Record<CategoryStatus, string> = {
  visible: "Visible",
  empty: "Vacía",
  hidden: "Oculta",
};

export const CATEGORY_NAME_MAX_LENGTH = 30;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 120;

/** "1 producto", "4 productos". */
export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Slug of `name` ("te-y-tisanas"), numbered when taken ("cafes-2"). */
export function createSlugId(name: string, existingIds: readonly string[], fallback: string): string {
  const slug = normalizeText(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
  const taken = new Set(existingIds);
  let candidate = slug;
  for (let index = 2; taken.has(candidate); index += 1) candidate = `${slug}-${index}`;
  return candidate;
}

export function createMenuCategories(source: readonly ProductCategoryInfo[] = PRODUCT_CATEGORIES): MenuCategory[] {
  return sortByOrder(source.map((category) => ({ ...category, archived: false })));
}

/** Non-archived categories in display order. */
export function getActiveCategories(categories: readonly MenuCategory[]): MenuCategory[] {
  return sortByOrder(categories.filter((category) => !category.archived));
}

/** Products assigned to the category; archived products left the menu and do not count. */
export function countCategoryProducts(products: readonly CatalogProductRef[], categoryId: string): number {
  return products.filter((product) => !product.archived && product.categoryId === categoryId).length;
}

/** Moments offering the category as a filter. */
export function countCategoryMoments(moments: readonly { categoryIds: readonly string[] }[], categoryId: string): number {
  return moments.filter((moment) => moment.categoryIds.includes(categoryId)).length;
}

export function getCategoryStatus(category: Pick<MenuCategory, "visible">, productCount: number): CategoryStatus {
  if (!category.visible) return "hidden";
  return productCount === 0 ? "empty" : "visible";
}

export type CategoryMetrics = { active: number; withProducts: number; empty: number };

/** 08C metrics: "Categorías activas" (visible), "Con productos" and "Vacías" over non-archived ones. */
export function getCategoryMetrics(
  categories: readonly MenuCategory[],
  products: readonly CatalogProductRef[],
): CategoryMetrics {
  const active = getActiveCategories(categories);
  const withProducts = active.filter((category) => countCategoryProducts(products, category.id) > 0).length;
  return {
    active: active.filter((category) => category.visible).length,
    withProducts,
    empty: active.length - withProducts,
  };
}

export type CategoryRow = {
  id: string;
  label: string;
  productCount: number;
  productLabel: string;
  momentCount: number;
  momentLabel: string;
  visible: boolean;
  status: CategoryStatus;
  statusLabel: string;
  orderLabel: string;
};

type CategoryRowsInput = {
  categories: readonly MenuCategory[];
  products: readonly CatalogProductRef[];
  moments: readonly { categoryIds: readonly string[] }[];
  query: string;
};

/** 08C table rows: active categories in display order, filtered by the search box. */
export function getCategoryRows({ categories, products, moments, query }: CategoryRowsInput): CategoryRow[] {
  const needle = normalizeText(query);
  return getActiveCategories(categories)
    .filter((category) => !needle || normalizeText(category.label).includes(needle))
    .map((category) => {
      const productCount = countCategoryProducts(products, category.id);
      const momentCount = countCategoryMoments(moments, category.id);
      const status = getCategoryStatus(category, productCount);
      return {
        id: category.id,
        label: category.label,
        productCount,
        productLabel: formatCount(productCount, "producto", "productos"),
        momentCount,
        momentLabel: formatCount(momentCount, "momento", "momentos"),
        visible: category.visible,
        status,
        statusLabel: CATEGORY_STATUS_LABELS[status],
        orderLabel: formatOrderNumber(category.order),
      };
    });
}

function replaceActive(categories: readonly MenuCategory[], active: readonly MenuCategory[]): MenuCategory[] {
  const byId = new Map(active.map((category) => [category.id, category]));
  return categories.map((category) => byId.get(category.id) ?? category);
}

/** Drag and drop: moves an active category to `toIndex` and renumbers the active ones. */
export function reorderCategories(categories: readonly MenuCategory[], id: string, toIndex: number): MenuCategory[] {
  return replaceActive(categories, moveToIndex(getActiveCategories(categories), id, toIndex));
}

/** Keyboard reordering: one step up (-1) or down (+1). */
export function moveCategory(categories: readonly MenuCategory[], id: string, step: number): MenuCategory[] {
  return replaceActive(categories, moveByStep(getActiveCategories(categories), id, step));
}

export function setCategoryVisibility(categories: readonly MenuCategory[], id: string, visible: boolean): MenuCategory[] {
  return categories.map((category) => (category.id === id ? { ...category, visible } : category));
}

/** Editable fields of 08D. */
export type CategoryDraft = { label: string; description: string; image?: string; visible: boolean };

export type CategoryFormErrors = Partial<Record<"label" | "description", string>>;

export function toCategoryDraft(category: MenuCategory): CategoryDraft {
  return { label: category.label, description: category.description, image: category.image, visible: category.visible };
}

export function createEmptyCategoryDraft(): CategoryDraft {
  return { label: "", description: "", visible: true };
}

/** Name required and unique among active categories; optional description. Copy is invented. */
export function validateCategoryDraft(
  draft: CategoryDraft,
  context: { categories: readonly MenuCategory[]; editingId: string | null },
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const label = draft.label.trim();
  if (!label) errors.label = "Ingresá un nombre.";
  else if (label.length > CATEGORY_NAME_MAX_LENGTH) errors.label = `Usá hasta ${CATEGORY_NAME_MAX_LENGTH} caracteres.`;
  else if (
    getActiveCategories(context.categories).some(
      (category) => category.id !== context.editingId && normalizeText(category.label) === normalizeText(label),
    )
  ) {
    errors.label = "Ya existe una categoría con ese nombre.";
  }
  if (draft.description.trim().length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Usá hasta ${CATEGORY_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  return errors;
}

/** Names of the 08D fields that differ between the saved category and the draft. */
export function getCategoryChanges(saved: CategoryDraft, draft: CategoryDraft): string[] {
  const changes: string[] = [];
  if (saved.label.trim() !== draft.label.trim()) changes.push("Nombre");
  if (saved.description.trim() !== draft.description.trim()) changes.push("Descripción");
  if (saved.image !== draft.image) changes.push("Imagen");
  if (saved.visible !== draft.visible) changes.push("Visibilidad");
  return changes;
}

/** Saves the draft over `editingId`, or appends a new category after the last active one. */
export function applyCategoryDraft(
  categories: readonly MenuCategory[],
  editingId: string | null,
  draft: CategoryDraft,
): { categories: MenuCategory[]; id: string } {
  const fields = {
    label: draft.label.trim(),
    description: draft.description.trim(),
    image: draft.image,
    visible: draft.visible,
  };
  if (editingId) {
    return {
      id: editingId,
      categories: categories.map((category) => (category.id === editingId ? { ...category, ...fields } : category)),
    };
  }
  const id = createSlugId(fields.label, categories.map((category) => category.id), "categoria");
  const created: MenuCategory = { id, ...fields, order: nextOrder(getActiveCategories(categories)), archived: false };
  return { id, categories: [...categories, created] };
}

export type ArchiveImpact = { requiresConfirmation: boolean; message: string };

/** 08D "Archivar requiere confirmación" card: in-use categories need a second click. */
export function getArchiveImpact(productCount: number, momentCount: number): ArchiveImpact {
  if (productCount === 0 && momentCount === 0) {
    return { requiresConfirmation: false, message: "Esta categoría no tiene productos ni momentos activos." };
  }
  const products = formatCount(productCount, "producto", "productos");
  const moments = formatCount(momentCount, "momento activo", "momentos activos");
  return {
    requiresConfirmation: true,
    message: `Esta categoría tiene ${products} y ${moments}. Archivarla no borra productos ni pedidos confirmados.`,
  };
}

/**
 * Archives a category: it leaves the list and the customer filters, its products keep their
 * category and orders are untouched; the remaining categories close the gap in the order.
 */
export function archiveCategory(categories: readonly MenuCategory[], id: string): MenuCategory[] {
  const marked = categories.map((category) => (category.id === id ? { ...category, archived: true } : category));
  return replaceActive(marked, renumber(getActiveCategories(marked)));
}
