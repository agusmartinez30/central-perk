import { CATALOG_VERSION, type Product } from "@/mocks/service-day";
import { formatPrice } from "@/shared/lib/format-price";
import { paginate } from "@/shared/lib/pagination";
import {
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_LIST_STATUS_LABELS,
  archiveProduct,
  duplicateProduct,
  formatCatalogShare,
  formatListSummary,
  formatMomentsLabel,
  formatProductCount,
  getCategoryLabel,
  getProductMetrics,
  getProductStatus,
  getVisibleProducts,
  hasActiveFilters,
  restoreProduct,
  setProductAvailability,
  type ProductFilters,
  type ProductMetrics,
  type ProductStatus,
} from "./product-catalog";
import { editorReducer, type EditorAction, type EditorState } from "./product-editor-state";

export { getEditorView, type EditorView, type EditorState, type SaveTone } from "./product-editor-state";

/** `list`: 07A. `editor`: 07B. `preview`: 07C, of the product open in the editor. */
export type ProductsScreenId = "list" | "editor" | "preview";

/** 07A rows per page: what fits the 1440×900 table. */
export const PRODUCTS_PAGE_SIZE = 7;

/**
 * An availability switch being saved (`pending`, shows the requested value) or whose last save
 * failed (`failed`, the switch is back to the saved value with "No se pudo guardar").
 */
export type AvailabilitySave = { status: "pending"; available: boolean } | { status: "failed" };

export type ProductsState = {
  /** The catalogue as edited in this session (in memory only). */
  products: Product[];
  filters: ProductFilters;
  /** Current list page (1-based); the view clamps it to the available pages. */
  page: number;
  /** Per-product availability saves, keyed by product id. */
  availabilitySaves: Record<string, AvailabilitySave>;
  /** "Versión 42": catalogue version, bumped by every product save. */
  version: number;
  /** Last action outcome, announced to screen readers. */
  notice: string | null;
  screen: ProductsScreenId;
  /** Set on the editor and preview screens. */
  editor: EditorState | null;
};

/** The "Disponibles" chip (`availability`) and the three filter selects. */
export type FilterKey = Exclude<keyof ProductFilters, "query">;

export type ProductsAction =
  | { type: "set-query"; query: string }
  | { [K in FilterKey]: { type: "set-filter"; filter: K; value: ProductFilters[K] } }[FilterKey]
  | { type: "reset-filters" }
  | { type: "set-page"; page: number }
  /** Commits a value right away (forced variants); the list switches go through the save actions. */
  | { type: "set-availability"; id: string; available: boolean }
  | { type: "start-availability-save"; id: string; available: boolean }
  | { type: "finish-availability-save"; id: string; ok: boolean }
  | { type: "duplicate"; id: string }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string }
  | EditorAction;

/** `set-filter` action for any filter; TypeScript cannot narrow the generic pair by itself. */
export function setFilter<K extends FilterKey>(filter: K, value: ProductFilters[K]): ProductsAction {
  return { type: "set-filter", filter, value } as ProductsAction;
}

export function createProductsState(
  products: Product[],
  overrides: Partial<Omit<ProductsState, "products">> = {},
): ProductsState {
  return {
    products,
    filters: DEFAULT_PRODUCT_FILTERS,
    page: 1,
    availabilitySaves: {},
    version: CATALOG_VERSION,
    notice: null,
    screen: "list",
    editor: null,
    ...overrides,
  };
}

function findProduct(state: ProductsState, id: string): Product | undefined {
  return state.products.find((product) => product.id === id);
}

function withoutSave(saves: Record<string, AvailabilitySave>, id: string): Record<string, AvailabilitySave> {
  return Object.fromEntries(Object.entries(saves).filter(([key]) => key !== id));
}

function availabilityNotice(product: Product, available: boolean): string {
  return `${product.name} ahora figura como ${available ? "disponible" : "no disponible"}.`;
}

export function productsReducer(state: ProductsState, action: ProductsAction): ProductsState {
  switch (action.type) {
    case "set-query":
      return { ...state, page: 1, filters: { ...state.filters, query: action.query } };
    case "set-filter":
      return { ...state, page: 1, filters: { ...state.filters, [action.filter]: action.value } };
    case "reset-filters":
      return { ...state, page: 1, filters: DEFAULT_PRODUCT_FILTERS };
    case "set-page":
      return { ...state, page: Math.max(1, Math.floor(action.page)) };
    case "set-availability": {
      const product = findProduct(state, action.id);
      if (!product || product.archived || product.available === action.available) return state;
      return {
        ...state,
        products: setProductAvailability(state.products, action.id, action.available),
        notice: availabilityNotice(product, action.available),
      };
    }
    case "start-availability-save": {
      const product = findProduct(state, action.id);
      if (!product || product.archived || product.available === action.available) return state;
      if (state.availabilitySaves[action.id]?.status === "pending") return state;
      return {
        ...state,
        availabilitySaves: { ...state.availabilitySaves, [action.id]: { status: "pending", available: action.available } },
        notice: `Actualizando la disponibilidad de ${product.name}…`,
      };
    }
    case "finish-availability-save": {
      const product = findProduct(state, action.id);
      const save = state.availabilitySaves[action.id];
      if (!product || save?.status !== "pending") return state;
      if (!action.ok) {
        return {
          ...state,
          availabilitySaves: { ...state.availabilitySaves, [action.id]: { status: "failed" } },
          notice: `No se pudo guardar la disponibilidad de ${product.name}.`,
        };
      }
      return {
        ...state,
        products: setProductAvailability(state.products, action.id, save.available),
        availabilitySaves: withoutSave(state.availabilitySaves, action.id),
        notice: availabilityNotice(product, save.available),
      };
    }
    case "duplicate": {
      const { products, product } = duplicateProduct(state.products, action.id);
      if (!product) return state;
      return { ...state, products, notice: `Se creó ${product.name} como borrador.` };
    }
    case "archive": {
      const product = findProduct(state, action.id);
      if (!product || product.archived) return state;
      return {
        ...state,
        products: archiveProduct(state.products, action.id),
        notice: `${product.name} se archivó. Podés restaurarlo desde el filtro Archivados.`,
      };
    }
    case "restore": {
      const product = findProduct(state, action.id);
      if (!product?.archived) return state;
      return {
        ...state,
        products: restoreProduct(state.products, action.id),
        notice: `${product.name} volvió a la carta como borrador.`,
      };
    }
    default:
      return editorReducer(state, action);
  }
}

/** One row of the 07A "Products Table · Commerce". */
export type ProductRowView = {
  id: string;
  name: string;
  image?: string;
  /** "Commercial Metadata", e.g. "Cafés · SKU CAF-014". */
  metaLabel: string;
  /** "Precio", e.g. "$4.600". */
  price: string;
  /** "Momentos", e.g. "Desayunar · Merendar". */
  momentsLabel: string;
  status: ProductStatus;
  /** "Publicado" / "No publicado" / "Archivado". */
  statusLabel: string;
  /** Value the switch shows: the requested one while saving. */
  available: boolean;
  availabilityState: "idle" | "pending" | "failed";
  /** "Disponible" / "No disponible" / "Actualizando…". */
  availabilityLabel: string;
  /** "No se pudo guardar" after a failed save. */
  availabilityError: string | null;
};

export type ProductsListView = {
  /** Rows of the current page. */
  rows: ProductRowView[];
  /** Metric cards count the whole catalogue, not only the filtered rows. */
  metrics: ProductMetrics;
  /** "Supporting" line under each metric. */
  metricSupport: Record<keyof ProductMetrics, string>;
  /** "13 productos": rows matching the filters, across pages. */
  countLabel: string;
  /** "Mostrando todos · Orden: relevancia comercial". */
  summaryLabel: string;
  total: number;
  page: number;
  pageCount: number;
  hasActiveFilters: boolean;
  /** No product matches the search and filters. */
  empty: boolean;
};

function toRow(product: Product, save: AvailabilitySave | undefined): ProductRowView {
  const status = getProductStatus(product);
  const pending = save?.status === "pending";
  const available = pending ? save.available : product.available;
  const category = getCategoryLabel(product.categoryId);
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    metaLabel: category ? `${category} · SKU ${product.sku}` : `SKU ${product.sku}`,
    price: formatPrice(product.price),
    momentsLabel: formatMomentsLabel(product.moments),
    status,
    statusLabel: PRODUCT_LIST_STATUS_LABELS[status],
    available,
    availabilityState: save?.status ?? "idle",
    availabilityLabel: pending ? "Actualizando…" : available ? "Disponible" : "No disponible",
    availabilityError: save?.status === "failed" ? "No se pudo guardar" : null,
  };
}

export function getProductsListView(state: ProductsState): ProductsListView {
  const current = paginate(getVisibleProducts(state.products, state.filters), state.page, PRODUCTS_PAGE_SIZE);
  const metrics = getProductMetrics(state.products);
  const catalogSize = state.products.filter((product) => !product.archived).length;
  const filtered = hasActiveFilters(state.filters);
  return {
    rows: current.items.map((product) => toRow(product, state.availabilitySaves[product.id])),
    metrics,
    metricSupport: {
      published: formatCatalogShare(metrics.published, catalogSize),
      available: "Listos para vender",
      unavailable: "Requieren revisión",
    },
    countLabel: formatProductCount(current.total),
    summaryLabel: formatListSummary(filtered),
    total: current.total,
    page: current.page,
    pageCount: current.pageCount,
    hasActiveFilters: filtered,
    empty: current.total === 0,
  };
}
