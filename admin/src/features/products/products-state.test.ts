import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import {
  PRODUCTS_PAGE_SIZE,
  createProductsState,
  getProductsListView,
  productsReducer,
  type ProductsAction,
  type ProductsState,
} from "./products-state";

const run = (...actions: ProductsAction[]): ProductsState =>
  actions.reduce(productsReducer, createProductsState(PRODUCTS));
/** Row names across every page, in list order. */
const names = (state: ProductsState) => {
  const { pageCount } = getProductsListView(state);
  return Array.from({ length: pageCount }, (_, index) =>
    getProductsListView(productsReducer(state, { type: "set-page", page: index + 1 })).rows.map((row) => row.name),
  ).flat();
};
const rowOf = (state: ProductsState, id: string) => {
  const { pageCount } = getProductsListView(state);
  for (let page = 1; page <= pageCount; page += 1) {
    const row = getProductsListView(productsReducer(state, { type: "set-page", page })).rows.find((item) => item.id === id);
    if (row) return row;
  }
  return undefined;
};

describe("products list view", () => {
  it("shows the first page by commercial relevance with the 07A metrics and footer", () => {
    const view = getProductsListView(createProductsState(PRODUCTS));
    expect(PRODUCTS_PAGE_SIZE).toBe(7);
    expect(view.rows).toHaveLength(7);
    expect(view.rows.slice(0, 3).map((row) => row.name)).toEqual(["Cappuccino", "Cappuccino grande", "Café latte"]);
    expect(view).toMatchObject({ page: 1, pageCount: 2, total: 13, hasActiveFilters: false, empty: false });
    expect(view.metrics).toEqual({ published: 12, available: 11, unavailable: 1 });
    expect(view.metricSupport).toEqual({
      published: "92% del catálogo",
      available: "Listos para vender",
      unavailable: "Requieren revisión",
    });
    expect(view.countLabel).toBe("13 productos");
    expect(view.summaryLabel).toBe("Mostrando todos · Orden: relevancia comercial");
  });

  it("describes each row as 07A shows it", () => {
    const state = createProductsState(PRODUCTS);
    expect(rowOf(state, "cappuccino")).toEqual({
      id: "cappuccino",
      name: "Cappuccino",
      image: "/images/products/cappuccino.webp",
      metaLabel: "Cafés · SKU CAF-014",
      price: "$4.600",
      momentsLabel: "Desayunar · Merendar",
      status: "published",
      statusLabel: "Publicado",
      available: true,
      availabilityState: "idle",
      availabilityLabel: "Disponible",
      availabilityError: null,
    });
    expect(rowOf(state, "hamburguesa-clasica")).toMatchObject({ available: false, availabilityLabel: "No disponible" });
    expect(rowOf(state, "cheesecake")).toMatchObject({ status: "draft", statusLabel: "No publicado", image: undefined });
  });

  it("filters with the search box, the selects and the Disponibles chip", () => {
    expect(names(run({ type: "set-query", query: "tost" }))).toEqual([
      "Tostón de palta",
      "Tostado clásico",
      "Tostado de jamón y queso",
    ]);
    expect(names(run({ type: "set-query", query: "beb-018" }))).toEqual(["Limonada"]);
    expect(names(run({ type: "set-filter", filter: "availability", value: "available" }))).not.toContain(
      "Hamburguesa clásica",
    );
    const filtered = getProductsListView(run({ type: "set-filter", filter: "category", value: "bebidas" }));
    expect(filtered).toMatchObject({
      countLabel: "2 productos",
      summaryLabel: "Con filtros aplicados · Orden: relevancia comercial",
      hasActiveFilters: true,
      pageCount: 1,
    });
    expect(filtered.metrics).toEqual({ published: 12, available: 11, unavailable: 1 });
    const none = getProductsListView(run({ type: "set-query", query: "pizza" }));
    expect(none).toMatchObject({ rows: [], empty: true, countLabel: "0 productos", pageCount: 1 });
  });

  it("resets every filter", () => {
    const state = run(
      { type: "set-query", query: "x" },
      { type: "set-filter", filter: "moment", value: "cenar" },
      { type: "reset-filters" },
    );
    expect(getProductsListView(state)).toMatchObject({ total: 13, hasActiveFilters: false });
  });
});

describe("products list pagination", () => {
  it("moves between pages and clamps out-of-range pages", () => {
    const second = getProductsListView(run({ type: "set-page", page: 2 }));
    expect(second.page).toBe(2);
    expect(second.rows.map((row) => row.name)).toHaveLength(6);
    expect(second.rows.at(-1)?.name).toBe("Cheesecake");
    expect(getProductsListView(run({ type: "set-page", page: 9 })).page).toBe(2);
  });

  it("goes back to the first page when the filters change", () => {
    expect(run({ type: "set-page", page: 2 }, { type: "set-query", query: "caf" }).page).toBe(1);
    expect(run({ type: "set-page", page: 2 }, { type: "set-filter", filter: "moment", value: "tomar" }).page).toBe(1);
    expect(run({ type: "set-page", page: 2 }, { type: "reset-filters" }).page).toBe(1);
  });
});

describe("productsReducer list actions", () => {
  it("switches availability in memory and updates the metrics", () => {
    const state = run({ type: "set-availability", id: "cappuccino", available: false });
    expect(rowOf(state, "cappuccino")).toMatchObject({ available: false, availabilityLabel: "No disponible" });
    expect(getProductsListView(state).metrics).toEqual({ published: 12, available: 10, unavailable: 2 });
    expect(state.notice).toBe("Cappuccino ahora figura como no disponible.");
  });

  it("duplicates a product as a draft next to the original", () => {
    const state = run({ type: "duplicate", id: "cappuccino" });
    expect(names(state).slice(0, 3)).toEqual(["Cappuccino", "Cappuccino (copia)", "Cappuccino grande"]);
    expect(rowOf(state, "cappuccino-copia")).toMatchObject({ status: "draft", price: "$4.600" });
    expect(getProductsListView(state).metrics.published).toBe(12);
    expect(state.notice).toBe("Se creó Cappuccino (copia) como borrador.");
  });

  it("archives a product out of the list and keeps it under the archived filter", () => {
    const state = run({ type: "archive", id: "limonada" });
    expect(names(state)).not.toContain("Limonada");
    expect(getProductsListView(state).metrics).toEqual({ published: 11, available: 10, unavailable: 1 });
    expect(state.notice).toBe("Limonada se archivó. Podés restaurarlo desde el filtro Archivados.");
    const archived = productsReducer(state, { type: "set-filter", filter: "publication", value: "archived" });
    expect(getProductsListView(archived).rows).toEqual([
      expect.objectContaining({ id: "limonada", status: "archived", statusLabel: "Archivado" }),
    ]);
  });

  it("restores an archived product as a draft", () => {
    const state = run({ type: "archive", id: "limonada" }, { type: "restore", id: "limonada" });
    expect(rowOf(state, "limonada")).toMatchObject({ status: "draft" });
    expect(state.notice).toBe("Limonada volvió a la carta como borrador.");
  });

  it("ignores availability changes of archived products and unknown ids", () => {
    const archived = run({ type: "archive", id: "limonada" });
    expect(productsReducer(archived, { type: "set-availability", id: "limonada", available: false })).toBe(archived);
    const state = createProductsState(PRODUCTS);
    expect(productsReducer(state, { type: "duplicate", id: "nope" })).toBe(state);
    expect(productsReducer(state, { type: "archive", id: "nope" })).toBe(state);
    expect(productsReducer(state, { type: "restore", id: "cappuccino" })).toBe(state);
  });

  it("never mutates the canonical catalogue", () => {
    run({ type: "archive", id: "cappuccino" }, { type: "duplicate", id: "limonada" });
    expect(PRODUCTS).toHaveLength(13);
    expect(PRODUCTS[0].archived).toBe(false);
  });
});

describe("async availability saves", () => {
  const start = (id: string, available: boolean): ProductsAction => ({ type: "start-availability-save", id, available });
  const finish = (id: string, ok: boolean): ProductsAction => ({ type: "finish-availability-save", id, ok });

  it("shows the requested value as pending without committing it", () => {
    const state = run(start("limonada", false));
    expect(rowOf(state, "limonada")).toMatchObject({
      available: false,
      availabilityState: "pending",
      availabilityLabel: "Actualizando…",
      availabilityError: null,
    });
    expect(state.products.find((product) => product.id === "limonada")?.available).toBe(true);
    expect(state.notice).toBe("Actualizando la disponibilidad de Limonada…");
  });

  it("commits the value when the save succeeds", () => {
    const state = run(start("cappuccino", false), finish("cappuccino", true));
    expect(rowOf(state, "cappuccino")).toMatchObject({
      available: false,
      availabilityState: "idle",
      availabilityLabel: "No disponible",
    });
    expect(getProductsListView(state).metrics).toEqual({ published: 12, available: 10, unavailable: 2 });
    expect(state.notice).toBe("Cappuccino ahora figura como no disponible.");
  });

  it("reverts the switch and shows the inline error when the save fails", () => {
    const state = run(start("hamburguesa-clasica", true), finish("hamburguesa-clasica", false));
    expect(rowOf(state, "hamburguesa-clasica")).toMatchObject({
      available: false,
      availabilityState: "failed",
      availabilityLabel: "No disponible",
      availabilityError: "No se pudo guardar",
    });
    expect(getProductsListView(state).metrics).toEqual({ published: 12, available: 11, unavailable: 1 });
    expect(state.notice).toBe("No se pudo guardar la disponibilidad de Hamburguesa clásica.");
  });

  it("clears a failure when the row is toggled again", () => {
    const state = run(start("cappuccino", false), finish("cappuccino", false), start("cappuccino", false));
    expect(rowOf(state, "cappuccino")).toMatchObject({ availabilityState: "pending", availabilityError: null });
  });

  it("ignores saves that change nothing, overlap or target archived products", () => {
    const state = createProductsState(PRODUCTS);
    expect(productsReducer(state, start("cappuccino", true))).toBe(state);
    expect(productsReducer(state, start("nope", false))).toBe(state);
    expect(productsReducer(state, finish("cappuccino", true))).toBe(state);
    const pending = productsReducer(state, start("cappuccino", false));
    expect(productsReducer(pending, start("cappuccino", true))).toBe(pending);
    const archived = run({ type: "archive", id: "limonada" });
    expect(productsReducer(archived, start("limonada", false))).toBe(archived);
  });
});
