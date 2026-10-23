import { CONSUMPTION_MOMENTS, type ConsumptionMomentInfo } from "@/mocks/service-day";
import { normalizeText } from "@/features/products/product-catalog";
import {
  createSlugId,
  formatCount,
  getActiveCategories,
  type CatalogProductRef,
  type MenuCategory,
} from "@/features/categories/category-catalog";
import { formatPrice } from "@/shared/lib/format-price";
import { moveByStep, moveToIndex, nextOrder, sortByOrder } from "@/shared/lib/ordering";

/** A moment as edited in 08; ids are plain strings so the session can create new ones. */
export type MenuMoment = Omit<ConsumptionMomentInfo, "id" | "categoryIds"> & { id: string; categoryIds: string[] };

export const MOMENT_NAME_MAX_LENGTH = 30;
export const MOMENT_DESCRIPTION_MAX_LENGTH = 60;

/** Virtual "Todos" filter of the customer preview: it is never stored. */
export const ALL_FILTER_ID = "todos";

const collator = new Intl.Collator("es", { sensitivity: "base" });

export function createMenuMoments(source: readonly ConsumptionMomentInfo[] = CONSUMPTION_MOMENTS): MenuMoment[] {
  return sortByOrder(source.map((moment) => ({ ...moment, categoryIds: [...moment.categoryIds] })));
}

/** Ids of the non-archived products assigned to the moment, in catalogue order. */
export function getMomentProductIds(products: readonly CatalogProductRef[], momentId: string): string[] {
  return products.filter((product) => !product.archived && product.moments.includes(momentId)).map((product) => product.id);
}

/** Active categories among `categoryIds`, in the 08C display order (the customer filter order). */
export function getAssociatedCategories(
  categoryIds: readonly string[],
  categories: readonly MenuCategory[],
): MenuCategory[] {
  return getActiveCategories(categories).filter((category) => categoryIds.includes(category.id));
}

export type MomentCard = {
  id: string;
  title: string;
  description: string;
  image?: string;
  visible: boolean;
  /** "Visible" (export) or "Oculto" (invented). */
  visibilityLabel: string;
  orderLabel: string;
  productLabel: string;
  categoryLabel: string;
  categorySummary: string;
};

type CatalogInput = {
  moments: readonly MenuMoment[];
  products: readonly CatalogProductRef[];
  categories: readonly MenuCategory[];
};

/** 08A cards in display order, with counts derived from the assignments. */
export function getMomentCards({ moments, products, categories }: CatalogInput): MomentCard[] {
  return sortByOrder(moments).map((moment) => {
    const associated = getAssociatedCategories(moment.categoryIds, categories);
    return {
      id: moment.id,
      title: moment.title,
      description: moment.description,
      image: moment.image,
      visible: moment.visible,
      visibilityLabel: moment.visible ? "Visible" : "Oculto",
      orderLabel: `Orden ${moment.order}`,
      productLabel: formatCount(getMomentProductIds(products, moment.id).length, "producto", "productos"),
      categoryLabel: formatCount(associated.length, "categoría", "categorías"),
      categorySummary: associated.map((category) => category.label).join(" · "),
    };
  });
}

export type MomentMetrics = { visibleMoments: number; activeCategories: number; totalCategories: number };

/** 08A metrics: "Momentos visibles", "Categorías activas" (visible) and "Categorías totales". */
export function getMomentMetrics(moments: readonly MenuMoment[], categories: readonly MenuCategory[]): MomentMetrics {
  const active = getActiveCategories(categories);
  return {
    visibleMoments: moments.filter((moment) => moment.visible).length,
    activeCategories: active.filter((category) => category.visible).length,
    totalCategories: active.length,
  };
}

export function setMomentVisibility(moments: readonly MenuMoment[], id: string, visible: boolean): MenuMoment[] {
  return moments.map((moment) => (moment.id === id ? { ...moment, visible } : moment));
}

/** Drag and drop: moves the moment to `toIndex` and renumbers. */
export function reorderMoments(moments: readonly MenuMoment[], id: string, toIndex: number): MenuMoment[] {
  return moveToIndex(moments, id, toIndex);
}

/** Keyboard reordering: one step up (-1) or down (+1). */
export function moveMoment(moments: readonly MenuMoment[], id: string, step: number): MenuMoment[] {
  return moveByStep(moments, id, step);
}

/** Editable content of 08B. `productIds` are explicit assignments, independent of categories. */
export type MomentDraft = {
  title: string;
  description: string;
  image?: string;
  visible: boolean;
  categoryIds: string[];
  productIds: string[];
};

export type MomentFormErrors = Partial<Record<"title" | "description", string>>;

export function toMomentDraft(moment: MenuMoment, products: readonly CatalogProductRef[]): MomentDraft {
  return {
    title: moment.title,
    description: moment.description,
    image: moment.image,
    visible: moment.visible,
    categoryIds: [...moment.categoryIds],
    productIds: getMomentProductIds(products, moment.id),
  };
}

export function createEmptyMomentDraft(): MomentDraft {
  return { title: "", description: "", visible: true, categoryIds: [], productIds: [] };
}

export function addDraftCategory(draft: MomentDraft, id: string): MomentDraft {
  return draft.categoryIds.includes(id) ? draft : { ...draft, categoryIds: [...draft.categoryIds, id] };
}

export function removeDraftCategory(draft: MomentDraft, id: string): MomentDraft {
  return { ...draft, categoryIds: draft.categoryIds.filter((categoryId) => categoryId !== id) };
}

export function addDraftProduct(draft: MomentDraft, id: string): MomentDraft {
  return draft.productIds.includes(id) ? draft : { ...draft, productIds: [...draft.productIds, id] };
}

export function removeDraftProduct(draft: MomentDraft, id: string): MomentDraft {
  return { ...draft, productIds: draft.productIds.filter((productId) => productId !== id) };
}

export type AssociatedProductRow = { id: string; name: string; available: boolean; availabilityLabel: string };

/** 08B "Productos asociados" rows in association order ("Disponible" / "Agotado"). */
export function getAssociatedProducts(
  draft: MomentDraft,
  products: readonly CatalogProductRef[],
): AssociatedProductRow[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return draft.productIds.flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    return [
      {
        id,
        name: product.name,
        available: product.available,
        availabilityLabel: product.available ? "Disponible" : "Agotado",
      },
    ];
  });
}

/** "Buscar productos existentes…": non-archived products not yet associated, by name. */
export function searchAssignableProducts(
  draft: MomentDraft,
  products: readonly CatalogProductRef[],
  query: string,
): CatalogProductRef[] {
  const needle = normalizeText(query);
  if (!needle) return [];
  return products
    .filter(
      (product) =>
        !product.archived && !draft.productIds.includes(product.id) && normalizeText(product.name).includes(needle),
    )
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** "Buscar categorías…": active categories not yet associated, in display order. */
export function searchAssignableCategories(
  draft: MomentDraft,
  categories: readonly MenuCategory[],
  query: string,
): MenuCategory[] {
  const needle = normalizeText(query);
  return getActiveCategories(categories).filter(
    (category) => !draft.categoryIds.includes(category.id) && (!needle || normalizeText(category.label).includes(needle)),
  );
}

/** Name required and unique, short description required. Copy is invented. */
export function validateMomentDraft(
  draft: MomentDraft,
  context: { moments: readonly MenuMoment[]; editingId: string | null },
): MomentFormErrors {
  const errors: MomentFormErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = "Ingresá un nombre.";
  else if (title.length > MOMENT_NAME_MAX_LENGTH) errors.title = `Usá hasta ${MOMENT_NAME_MAX_LENGTH} caracteres.`;
  else if (
    context.moments.some(
      (moment) => moment.id !== context.editingId && normalizeText(moment.title) === normalizeText(title),
    )
  ) {
    errors.title = "Ya existe un momento con ese nombre.";
  }
  const description = draft.description.trim();
  if (!description) errors.description = "Ingresá una descripción breve.";
  else if (description.length > MOMENT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Usá hasta ${MOMENT_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  return errors;
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

/** Sections of 08B that differ between the saved moment and the draft (association order ignored). */
export function getMomentChanges(saved: MomentDraft, draft: MomentDraft): string[] {
  const changes: string[] = [];
  if (saved.title.trim() !== draft.title.trim()) changes.push("Nombre");
  if (saved.description.trim() !== draft.description.trim()) changes.push("Descripción");
  if (saved.image !== draft.image) changes.push("Portada");
  if (saved.visible !== draft.visible) changes.push("Visibilidad");
  if (!sameSet(saved.categoryIds, draft.categoryIds)) changes.push("Categorías");
  if (!sameSet(saved.productIds, draft.productIds)) changes.push("Productos");
  return changes;
}

/**
 * Saves the draft over `editingId` (or appends a new moment) and rewrites the product
 * assignments: exactly the draft's products carry the moment afterwards.
 */
export function applyMomentDraft(
  catalog: { moments: readonly MenuMoment[]; products: readonly CatalogProductRef[] },
  editingId: string | null,
  draft: MomentDraft,
): { moments: MenuMoment[]; products: CatalogProductRef[]; id: string } {
  const fields = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    image: draft.image,
    visible: draft.visible,
    categoryIds: [...draft.categoryIds],
  };
  let id: string;
  let moments: MenuMoment[];
  if (editingId) {
    id = editingId;
    moments = catalog.moments.map((moment) => (moment.id === editingId ? { ...moment, ...fields } : moment));
  } else {
    id = createSlugId(fields.title, catalog.moments.map((moment) => moment.id), "momento");
    moments = [...catalog.moments, { id, label: fields.title, ...fields, order: nextOrder(catalog.moments) }];
  }
  const products = catalog.products.map((product) => {
    const assigned = product.moments.includes(id);
    const wanted = draft.productIds.includes(product.id);
    if (assigned === wanted) return product;
    return { ...product, moments: wanted ? [...product.moments, id] : product.moments.filter((moment) => moment !== id) };
  });
  return { moments, products, id };
}

export type ExploreFilter = { id: string; label: string; active: boolean };

export type ExploreProductCard = { id: string; name: string; priceLabel: string; image?: string };

export type ExplorePreview = {
  title: string;
  description: string;
  image?: string;
  filters: ExploreFilter[];
  countLabel: string;
  products: ExploreProductCard[];
};

/**
 * Customer "Explore" screen of a moment (08B phone, 08E): published products of the moment,
 * "Todos" plus the visible associated categories that have at least one of them ("No mostrar
 * filtros de categorías vacías") in the 08C order, products grouped by filter and then by name. An unknown or
 * hidden `filterId` falls back to "Todos".
 */
export function getExplorePreview(
  moment: Pick<MomentDraft, "title" | "description" | "image" | "categoryIds" | "productIds">,
  catalog: { products: readonly CatalogProductRef[]; categories: readonly MenuCategory[] },
  filterId: string,
): ExplorePreview {
  const byId = new Map(catalog.products.map((product) => [product.id, product]));
  const shown = moment.productIds.flatMap((id) => {
    const product = byId.get(id);
    return product && !product.archived && product.publication === "published" ? [product] : [];
  });
  const categories = getAssociatedCategories(moment.categoryIds, catalog.categories).filter(
    (category) => category.visible && shown.some((product) => product.categoryId === category.id),
  );
  const activeId = categories.some((category) => category.id === filterId) ? filterId : ALL_FILTER_ID;
  const rank = (product: CatalogProductRef) => {
    const index = categories.findIndex((category) => category.id === product.categoryId);
    return index === -1 ? categories.length : index;
  };
  const products = shown
    .filter((product) => activeId === ALL_FILTER_ID || product.categoryId === activeId)
    .sort((a, b) => rank(a) - rank(b) || collator.compare(a.name, b.name));
  return {
    title: moment.title,
    description: moment.description,
    image: moment.image,
    filters: [
      { id: ALL_FILTER_ID, label: "Todos", active: activeId === ALL_FILTER_ID },
      ...categories.map((category) => ({ id: category.id, label: category.label, active: category.id === activeId })),
    ],
    countLabel: formatCount(products.length, "producto", "productos"),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      priceLabel: formatPrice(product.price),
      image: product.image,
    })),
  };
}
