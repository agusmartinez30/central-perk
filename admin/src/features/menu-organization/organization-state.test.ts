import { describe, expect, it } from "vitest";
import { getMomentProductIds } from "@/features/moments/moment-catalog";
import {
  createOrganizationState,
  getCategoriesListView,
  getCategoryEditorView,
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

describe("categories list (08C)", () => {
  const onCategories = () => run([{ type: "set-tab", tab: "categories" }]);

  it("lists the categories with derived metrics", () => {
    const view = getCategoriesListView(onCategories());
    expect(view.metrics).toEqual({ active: 9, withProducts: 8, empty: 1 });
    expect(view.rows).toHaveLength(9);
    expect(view.rows[0]).toMatchObject({ label: "Cafés", productLabel: "4 productos", orderLabel: "01" });
  });

  it("searches categories", () => {
    const state = run([{ type: "set-category-query", query: "pan" }], onCategories());
    expect(getCategoriesListView(state).rows.map((row) => row.label)).toEqual(["Panadería"]);
  });

  it("reorders categories by drag and by keyboard", () => {
    const dragged = run([{ type: "reorder-category", id: "licuados", toIndex: 1 }], onCategories());
    expect(getCategoriesListView(dragged).rows.slice(0, 2).map((row) => row.label)).toEqual(["Cafés", "Licuados"]);
    expect(dragged.notice).toBe("Licuados pasó al orden 02.");
    const moved = run([{ type: "move-category", id: "cafes", step: 1 }], onCategories());
    expect(getCategoriesListView(moved).rows.slice(0, 2).map((row) => row.label)).toEqual(["Tostadas", "Cafés"]);
  });

  it("shows the associated categories in the new category order", () => {
    const moved = run([{ type: "move-category", id: "tostadas", step: -1 }], onCategories());
    expect(getMomentsListView(moved).cards[0].categorySummary).toBe("Tostadas · Cafés · Panadería · Bebidas");
  });
});

describe("category editor (08D)", () => {
  it("opens a category with its derived associations", () => {
    const state = run([{ type: "open-category", id: "cafes" }]);
    expect(state.view).toBe("category-editor");
    expect(getCategoryEditorView(state)).toMatchObject({
      title: "Editar categoría",
      statusLabel: "Sin cambios · control de versión activo",
      dirty: false,
      canSave: false,
      canArchive: true,
      settingsLabel: "Visible en la carta · Orden 01",
      productCount: 4,
      archiveTitle: "Archivar requiere confirmación",
      archiveMessage:
        "Esta categoría tiene 4 productos y 3 momentos activos. Archivarla no borra productos ni pedidos confirmados.",
      confirmingArchive: false,
      auditRules: [
        "✓ Los cambios quedan registrados en auditoría.",
        "✓ Los permisos se verifican en el servidor.",
        "✓ Versión actual: 42 · evita sobrescrituras.",
      ],
    });
  });

  it("saves edits in memory and returns to the categories tab", () => {
    const saved = run([
      { type: "open-category", id: "cafes" },
      { type: "category-set-field", field: "label", value: "Café de especialidad" },
      { type: "category-set-visible", visible: false },
      { type: "category-save" },
    ]);
    expect(getCategoryEditorView(saved)).toMatchObject({ dirty: false, settingsLabel: "Oculta en la carta · Orden 01" });
    expect(saved.version).toBe(43);
    expect(saved.notice).toBe("Café de especialidad se guardó.");
    const back = organizationReducer(saved, { type: "close-editor" });
    expect(back.view).toBe("categories");
    expect(getCategoriesListView(back).rows[0]).toMatchObject({ label: "Café de especialidad", statusLabel: "Oculta" });
  });

  it("blocks a duplicate name", () => {
    const blocked = run([
      { type: "open-category", id: "cafes" },
      { type: "category-set-field", field: "label", value: "Postres" },
      { type: "category-save" },
    ]);
    expect(getCategoryEditorView(blocked)?.errors).toEqual({ label: "Ya existe una categoría con ese nombre." });
    expect(blocked.version).toBe(42);
  });

  it("creates an empty category at the end", () => {
    const opened = run([{ type: "open-new-category" }]);
    expect(getCategoryEditorView(opened)).toMatchObject({
      title: "Crear categoría",
      statusLabel: "Categoría nueva sin guardar · control de versión activo",
      canSave: true,
      canArchive: false,
      settingsLabel: "Visible en la carta · Orden 10",
      productCount: 0,
    });
    const saved = run(
      [
        { type: "category-set-field", field: "label", value: "Té y tisanas" },
        { type: "category-save" },
        { type: "close-editor" },
      ],
      opened,
    );
    expect(getCategoriesListView(saved).rows.at(-1)).toMatchObject({ label: "Té y tisanas", status: "empty", orderLabel: "10" });
  });

  it("asks once before archiving a category in use, then archives it", () => {
    const asked = run([{ type: "open-category", id: "cafes" }, { type: "category-archive" }]);
    expect(getCategoryEditorView(asked)?.confirmingArchive).toBe(true);
    expect(asked.categories.find((category) => category.id === "cafes")?.archived).toBe(false);

    const cancelled = organizationReducer(asked, { type: "category-cancel-archive" });
    expect(getCategoryEditorView(cancelled)?.confirmingArchive).toBe(false);

    const archived = organizationReducer(asked, { type: "category-archive" });
    expect(archived.view).toBe("categories");
    expect(archived.categoryEditor).toBeNull();
    expect(getCategoriesListView(archived).rows.map((row) => row.label)).not.toContain("Cafés");
    expect(archived.products.filter((product) => product.categoryId === "cafes")).toHaveLength(4);
    expect(getMomentsListView(archived).cards[0].categorySummary).toBe("Tostadas · Panadería · Bebidas");
    expect(archived.notice).toBe("Cafés se archivó. Sus productos y pedidos no cambian.");
  });

  it("archives an unused category without asking", () => {
    const state = run([
      { type: "open-new-category" },
      { type: "category-set-field", field: "label", value: "Té" },
      { type: "category-save" },
      { type: "category-archive" },
    ]);
    expect(state.view).toBe("categories");
    expect(getCategoriesListView(state).rows.map((row) => row.label)).not.toContain("Té");
  });
});
