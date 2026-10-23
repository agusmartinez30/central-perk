import { describe, expect, it } from "vitest";
import { getMomentProductIds } from "@/features/moments/moment-catalog";
import {
  createOrganizationState,
  getMomentEditorView,
  getMomentsListView,
  organizationReducer,
  type OrganizationAction,
  type OrganizationState,
} from "./organization-state";

const run = (actions: OrganizationAction[], state: OrganizationState = createOrganizationState()) =>
  actions.reduce(organizationReducer, state);

describe("moments list (08A)", () => {
  it("opens on the moments tab with derived metrics and cards", () => {
    const state = createOrganizationState();
    expect(state.view).toBe("moments");
    const view = getMomentsListView(state);
    expect(view.metrics).toEqual({ visibleMoments: 4, activeCategories: 9, totalCategories: 9 });
    expect(view.cards.map((card) => card.productLabel)).toEqual(["7 productos", "9 productos", "4 productos", "3 productos"]);
  });

  it("switches tabs", () => {
    expect(run([{ type: "set-tab", tab: "categories" }]).view).toBe("categories");
    expect(run([{ type: "set-tab", tab: "categories" }, { type: "set-tab", tab: "moments" }]).view).toBe("moments");
  });

  it("hides a moment and announces it", () => {
    const state = run([{ type: "set-moment-visibility", id: "cenar", visible: false }]);
    expect(getMomentsListView(state).metrics.visibleMoments).toBe(3);
    expect(state.notice).toBe("Para cenar ya no se muestra en la carta.");
  });

  it("reorders moments by drag and by keyboard", () => {
    const dragged = run([{ type: "reorder-moment", id: "tomar", toIndex: 0 }]);
    expect(getMomentsListView(dragged).cards.map((card) => [card.title, card.orderLabel])[0]).toEqual([
      "Para tomar",
      "Orden 1",
    ]);
    const moved = run([{ type: "move-moment", id: "desayunar", step: 1 }]);
    expect(getMomentsListView(moved).cards.map((card) => card.id)).toEqual(["merendar", "desayunar", "cenar", "tomar"]);
    expect(moved.notice).toBe("Para desayunar pasó al orden 2.");
  });
});

describe("moment editor (08B)", () => {
  it("opens a moment clean, with its derived products", () => {
    const state = run([{ type: "open-moment", id: "desayunar" }]);
    expect(state.view).toBe("moment-editor");
    const view = getMomentEditorView(state);
    expect(view).toMatchObject({
      title: "Editar momento",
      statusLabel: "Sin cambios · versión 42",
      dirty: false,
      canSave: false,
      canDiscard: false,
      publicationLabel: "Visible en la carta · Orden 1",
      productsTitle: "Productos asociados · 7",
    });
    expect(view?.selectedCategories.map((category) => category.label)).toEqual(["Cafés", "Tostadas", "Panadería", "Bebidas"]);
    expect(view?.preview.countLabel).toBe("7 productos");
  });

  it("tracks unsaved changes and discards them", () => {
    const edited = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-add-product", id: "limonada" },
    ]);
    expect(getMomentEditorView(edited)).toMatchObject({
      statusLabel: "Cambios sin guardar · versión 42",
      dirty: true,
      canSave: true,
      canDiscard: true,
      productsTitle: "Productos asociados · 8",
    });
    const discarded = organizationReducer(edited, { type: "moment-discard" });
    expect(getMomentEditorView(discarded)?.dirty).toBe(false);
  });

  it("updates the phone preview with the draft", () => {
    const state = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-set-field", field: "title", value: "Desayunos" },
      { type: "moment-remove-category", id: "cafes" },
      { type: "set-preview-filter", filterId: "tostadas" },
    ]);
    const preview = getMomentEditorView(state)?.preview;
    expect(preview?.title).toBe("Desayunos");
    expect(preview?.filters.map((filter) => filter.label)).toEqual(["Todos", "Tostadas", "Panadería", "Bebidas"]);
    expect(preview?.countLabel).toBe("1 producto");
  });

  it("suggests categories and products from the search boxes", () => {
    const state = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-set-query", field: "category", value: "post" },
      { type: "moment-set-query", field: "product", value: "limo" },
    ]);
    const view = getMomentEditorView(state);
    expect(view?.categorySuggestions.map((category) => category.label)).toEqual(["Postres"]);
    expect(view?.productSuggestions.map((product) => product.name)).toEqual(["Limonada"]);
    const added = organizationReducer(state, { type: "moment-add-product", id: "limonada" });
    expect(added.momentEditor?.productQuery).toBe("");
  });

  it("blocks saving with errors and shows them only after trying", () => {
    const state = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-set-field", field: "title", value: "" },
    ]);
    expect(getMomentEditorView(state)?.errors).toEqual({});
    const blocked = organizationReducer(state, { type: "moment-save" });
    expect(getMomentEditorView(blocked)?.errors).toEqual({ title: "Ingresá un nombre." });
    expect(blocked.moments).toBe(state.moments);
    expect(blocked.notice).toBe("Revisá los campos marcados antes de guardar.");
  });

  it("saves in memory, bumps the version and keeps the editor open", () => {
    const saved = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-set-field", field: "description", value: "Para arrancar el día." },
      { type: "moment-remove-product", id: "cappuccino" },
      { type: "moment-save" },
    ]);
    expect(saved.version).toBe(43);
    expect(getMomentEditorView(saved)).toMatchObject({ dirty: false, statusLabel: "Sin cambios · versión 43" });
    expect(getMomentProductIds(saved.products, "desayunar")).not.toContain("cappuccino");
    expect(saved.notice).toBe("Para desayunar se guardó.");
    const back = organizationReducer(saved, { type: "close-editor" });
    expect(back.view).toBe("moments");
    expect(getMomentsListView(back).cards[0]).toMatchObject({ description: "Para arrancar el día.", productLabel: "6 productos" });
  });

  it("creates a moment from an empty form", () => {
    const opened = run([{ type: "open-new-moment" }]);
    expect(getMomentEditorView(opened)).toMatchObject({
      title: "Crear momento",
      statusLabel: "Momento nuevo sin guardar · versión 42",
      publicationLabel: "Visible en la carta · Orden 5",
      canSave: true,
      canDiscard: false,
    });
    const saved = run(
      [
        { type: "moment-set-field", field: "title", value: "Para el brunch" },
        { type: "moment-set-field", field: "description", value: "Sin apuro." },
        { type: "moment-save" },
        { type: "close-editor" },
      ],
      opened,
    );
    expect(getMomentsListView(saved).cards.at(-1)).toMatchObject({ title: "Para el brunch", orderLabel: "Orden 5" });
  });

  it("leaves the editor discarding the draft", () => {
    const state = run([
      { type: "open-moment", id: "cenar" },
      { type: "moment-set-field", field: "title", value: "Cena" },
      { type: "close-editor" },
    ]);
    expect(state.momentEditor).toBeNull();
    expect(getMomentsListView(state).cards[2].title).toBe("Para cenar");
  });
});
