import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import { getOptionGroupRule, getProductPreviewView } from "./product-preview";
import { createProductsState, productsReducer, type ProductsAction, type ProductsState } from "./products-state";

const run = (...actions: ProductsAction[]): ProductsState =>
  actions.reduce(productsReducer, createProductsState(PRODUCTS));
const openCappuccino = (...actions: ProductsAction[]) =>
  run({ type: "open-editor", id: "cappuccino" }, ...actions, { type: "open-preview" });

describe("getProductPreviewView", () => {
  it("returns null without an open editor", () => {
    expect(getProductPreviewView(createProductsState(PRODUCTS), null)).toBeNull();
  });

  it("summarizes the saved product with the 07C copy", () => {
    const view = getProductPreviewView(openCappuccino(), null)!;
    expect(view).toMatchObject({
      version: "published",
      breadcrumb: "Cappuccino",
      skuLabel: "SKU CAF-014",
      published: true,
      publicationLabel: "Publicado",
      available: true,
      optionsSummary: "2 grupos · 6 opciones",
    });
    expect(view.preview).toMatchObject({
      name: "Cappuccino",
      price: "$4.600",
      categoryLabel: "Cafés",
      momentsLabel: "Desayunar · Merendar",
      availabilityLabel: "Disponible",
    });
    expect(view.groups).toEqual([
      {
        id: "tamano",
        title: "Tamaño",
        rule: "Obligatorio · Selección única",
        options: [
          { id: "chico", name: "Chico", priceLabel: "Incluido", extraCharge: false },
          { id: "mediano", name: "Mediano", priceLabel: "+$800", extraCharge: true },
          { id: "grande", name: "Grande", priceLabel: "+$1.500", extraCharge: true },
        ],
      },
      expect.objectContaining({ id: "extras", title: "Extras", rule: "Opcional · Máximo 2" }),
    ]);
    expect(view.groups[1].options.at(-1)).toEqual({
      id: "canela",
      name: "Canela",
      priceLabel: "Sin cargo",
      extraCharge: false,
    });
  });

  it("disables the pending version while the draft has no changes", () => {
    const view = getProductPreviewView(openCappuccino(), "pending")!;
    expect(view.version).toBe("published");
    expect(view.versions).toEqual([
      { id: "published", label: "Versión publicada", disabled: false },
      { id: "pending", label: "Cambios pendientes", disabled: true },
    ]);
  });

  it("opens on the pending changes and switches between both versions", () => {
    const state = openCappuccino(
      { type: "toggle-moment", moment: "tomar" },
      { type: "set-field", field: "price", value: "$4.900" },
      { type: "set-draft-availability", available: false },
      { type: "set-draft-publication", published: false },
    );
    const pending = getProductPreviewView(state, null)!;
    expect(pending).toMatchObject({ version: "pending", published: false, publicationLabel: "No publicado", available: false });
    expect(pending.preview).toMatchObject({ price: "$4.900", momentsLabel: "Desayunar · Merendar · Tomar" });
    expect(pending.versions.every((version) => !version.disabled)).toBe(true);

    const published = getProductPreviewView(state, "published")!;
    expect(published).toMatchObject({ version: "published", published: true, available: true });
    expect(published.preview).toMatchObject({ price: "$4.600", momentsLabel: "Desayunar · Merendar" });
  });

  it("only offers the pending version of a product that was never saved", () => {
    const state = run({ type: "open-new" }, { type: "set-field", field: "name", value: "Flat white" }, { type: "open-preview" });
    const view = getProductPreviewView(state, "published")!;
    expect(view).toMatchObject({ version: "pending", breadcrumb: "Nuevo producto", skuLabel: null });
    expect(view.preview.name).toBe("Flat white");
    expect(view.versions.find((version) => version.id === "published")?.disabled).toBe(true);
  });
});

describe("getOptionGroupRule", () => {
  it("states the requirement first, then the selection or its limit", () => {
    expect(getOptionGroupRule({ selection: "single", required: true })).toBe("Obligatorio · Selección única");
    expect(getOptionGroupRule({ selection: "single", required: false })).toBe("Opcional · Selección única");
    expect(getOptionGroupRule({ selection: "multiple", required: false, max: 2 })).toBe("Opcional · Máximo 2");
    expect(getOptionGroupRule({ selection: "multiple", required: true })).toBe("Obligatorio · Selección múltiple");
  });
});
