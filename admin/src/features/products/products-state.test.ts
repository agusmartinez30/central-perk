import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import { createProductsState, getProductsListView, productsReducer, type ProductsAction, type ProductsState } from "./products-state";

const run = (...actions: ProductsAction[]): ProductsState =>
  actions.reduce(productsReducer, createProductsState(PRODUCTS));
const names = (state: ProductsState) => getProductsListView(state).rows.map((row) => row.name);
const rowOf = (state: ProductsState, id: string) => getProductsListView(state).rows.find((row) => row.id === id);

describe("products list view", () => {
  it("lists every product by name with the 07A metrics and footer", () => {
    const view = getProductsListView(createProductsState(PRODUCTS));
    expect(view.rows).toHaveLength(13);
    expect(view.rows.slice(0, 3).map((row) => row.name)).toEqual(["Café con leche", "Café latte", "Cappuccino"]);
    expect(view.metrics).toEqual({ published: 12, available: 11, unavailable: 1 });
    expect(view.countLabel).toBe("13 productos · Ordenados por nombre");
  });

  it("describes each row as 07A shows it", () => {
    const state = createProductsState(PRODUCTS);
    expect(rowOf(state, "cappuccino")).toEqual({
      id: "cappuccino",
      name: "Cappuccino",
      image: "/images/products/cappuccino.webp",
      categoryLabel: "Cafés",
      price: "$4.600",
      status: "published",
      statusLabel: "Publicado",
      available: true,
      availabilityLabel: "Disponible",
    });
    expect(rowOf(state, "hamburguesa-clasica")).toMatchObject({ available: false, availabilityLabel: "No disponible" });
    expect(rowOf(state, "cheesecake")).toMatchObject({ status: "draft", statusLabel: "Borrador", image: undefined });
  });

  it("filters with the search box and the selects", () => {
    expect(names(run({ type: "set-query", query: "tost" }))).toEqual([
      "Tostado clásico",
      "Tostado de jamón y queso",
      "Tostón de palta",
    ]);
    expect(names(run({ type: "set-filter", filter: "availability", value: "unavailable" }))).toEqual([
      "Hamburguesa clásica",
    ]);
    const filtered = run({ type: "set-filter", filter: "category", value: "bebidas" });
    expect(getProductsListView(filtered).countLabel).toBe("2 productos · Ordenados por nombre");
    expect(getProductsListView(filtered).metrics).toEqual({ published: 12, available: 11, unavailable: 1 });
    expect(names(run({ type: "set-query", query: "pizza" }))).toEqual([]);
    expect(getProductsListView(run({ type: "set-query", query: "pizza" })).countLabel).toBe(
      "Sin productos para estos filtros",
    );
  });

  it("resets every filter", () => {
    const state = run(
      { type: "set-query", query: "x" },
      { type: "set-filter", filter: "moment", value: "cenar" },
      { type: "reset-filters" },
    );
    expect(names(state)).toHaveLength(13);
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
    expect(names(state).slice(2, 5)).toEqual(["Cappuccino", "Cappuccino (copia)", "Cappuccino grande"]);
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
