import { CATALOG_VERSION, type Product } from "@/mocks/service-day";
import { formatPrice } from "@/shared/lib/format-price";
import {
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_STATUS_LABELS,
  archiveProduct,
  duplicateProduct,
  formatProductCount,
  getCategoryLabel,
  getProductMetrics,
  getProductStatus,
  getVisibleProducts,
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

export type ProductsState = {
  /** The catalogue as edited in this session (in memory only). */
  products: Product[];
  filters: ProductFilters;
  /** "Versión 42": catalogue version, bumped by every product save. */
  version: number;
  /** Last action outcome, announced to screen readers. */
  notice: string | null;
  screen: ProductsScreenId;
  /** Set on the editor and preview screens. */
  editor: EditorState | null;
};

/** The four selects of "Product Filter Selects". */
export type FilterKey = Exclude<keyof ProductFilters, "query">;

export type ProductsAction =
  | { type: "set-query"; query: string }
  | { [K in FilterKey]: { type: "set-filter"; filter: K; value: ProductFilters[K] } }[FilterKey]
  | { type: "reset-filters" }
  | { type: "set-availability"; id: string; available: boolean }
  | { type: "duplicate"; id: string }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string }
  | EditorAction;

/** `set-filter` action for any select; TypeScript cannot narrow the generic pair by itself. */
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

export function productsReducer(state: ProductsState, action: ProductsAction): ProductsState {
  switch (action.type) {
    case "set-query":
      return { ...state, filters: { ...state.filters, query: action.query } };
    case "set-filter":
      return { ...state, filters: { ...state.filters, [action.filter]: action.value } };
    case "reset-filters":
      return { ...state, filters: DEFAULT_PRODUCT_FILTERS };
    case "set-availability": {
      const product = findProduct(state, action.id);
      if (!product || product.archived || product.available === action.available) return state;
      return {
        ...state,
        products: setProductAvailability(state.products, action.id, action.available),
        notice: `${product.name} ahora figura como ${action.available ? "disponible" : "no disponible"}.`,
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

/** One row of the 07A "Product Catalog Table". */
export type ProductRowView = {
  id: string;
  name: string;
  image?: string;
  categoryLabel: string;
  /** "Precio base", e.g. "$4.600". */
  price: string;
  status: ProductStatus;
  statusLabel: string;
  available: boolean;
  availabilityLabel: string;
};

export type ProductsListView = {
  rows: ProductRowView[];
  /** Metric cards count the whole catalogue, not only the filtered rows. */
  metrics: ProductMetrics;
  /** "13 productos · Ordenados por nombre". */
  countLabel: string;
};

function toRow(product: Product): ProductRowView {
  const status = getProductStatus(product);
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    categoryLabel: getCategoryLabel(product.categoryId) ?? "",
    price: formatPrice(product.price),
    status,
    statusLabel: PRODUCT_STATUS_LABELS[status],
    available: product.available,
    availabilityLabel: product.available ? "Disponible" : "No disponible",
  };
}

export function getProductsListView(state: ProductsState): ProductsListView {
  const rows = getVisibleProducts(state.products, state.filters).map(toRow);
  return { rows, metrics: getProductMetrics(state.products), countLabel: formatProductCount(rows.length) };
}
