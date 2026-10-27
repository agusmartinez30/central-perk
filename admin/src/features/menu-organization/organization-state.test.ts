import { describe, expect, it } from "vitest";
import { getMomentProductIds } from "@/features/moments/moment-catalog";
import {
  createOrganizationState,
  getCategoriesListView,
  getCategoryEditorView,
  getMomentEditorView,
  getMomentsListView,
  getPreviewView,
  organizationReducer,
  type OrganizationAction,
  type OrganizationState,
} from "./organization-state";

const SAVED_AT = new Date(2026, 9, 26, 16, 5).toISOString();
const saveCategory: OrganizationAction = { type: "category-save", at: SAVED_AT };

const run = (actions: OrganizationAction[], state: OrganizationState = createOrganizationState()) =>
  actions.reduce(organizationReducer, state);

describe("moments list (08A)", () => {
  it("opens on the moments tab with derived metrics and cards", () => {
    const state = createOrganizationState();
    expect(state.view).toBe("moments");
    const view = getMomentsListView(state);
    expect(view.metrics.map((metric) => [metric.label, metric.value, metric.detail])).toEqual([
      ["Momentos", 4, "Total configurados"],
      ["Visibles", 4, "En la carta digital"],
      ["Productos asignados", 13, "Entre los 4 momentos"],
    ]);
    expect(view.cards.map((card) => card.productLabel)).toEqual(["7 productos", "9 productos", "4 productos", "3 productos"]);
  });

  it("switches tabs", () => {
    expect(run([{ type: "set-tab", tab: "categories" }]).view).toBe("categories");
    expect(run([{ type: "set-tab", tab: "categories" }, { type: "set-tab", tab: "moments" }]).view).toBe("moments");
  });

  it("hides a moment and announces it", () => {
    const state = run([{ type: "set-moment-visibility", id: "cenar", visible: false }]);
    expect(getMomentsListView(state).metrics[1].value).toBe(3);
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

  it("numbers the cards and disables the order arrows at the ends", () => {
    const cards = getMomentsListView(createOrganizationState()).cards;
    expect(cards.map((card) => [card.order, card.canMoveUp, card.canMoveDown])).toEqual([
      [1, false, true],
      [2, true, true],
      [3, true, true],
      [4, true, false],
    ]);
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
      breadcrumb: ["CARTA DIGITAL", "MOMENTOS", "PARA DESAYUNAR"],
      order: 1,
      pendingLabel: null,
      categoriesHint: "4 seleccionadas · Se muestran en este momento",
      productsHint: "7 productos · 7 visibles en la carta",
      productPickerOpen: false,
      saveBar: { title: "Sin cambios", hint: "Versión 42 · La publicación actual no cambia hasta guardar" },
    });
    expect(view?.products[0]).toMatchObject({ name: "Cappuccino", categoryLabel: "Cafés", availabilityLabel: "Disponible" });
    expect(view?.selectedCategories.map((category) => category.label)).toEqual(["Cafés", "Tostadas", "Panadería", "Bebidas"]);
    expect(view?.preview.countLabel).toBe("7 productos disponibles");
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
      pendingLabel: "Cambios sin guardar",
      productsHint: "8 productos · 8 visibles en la carta",
      saveBar: { title: "Cambios sin guardar", hint: "Versión 42 · La publicación actual no cambia hasta guardar" },
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
    expect(preview?.countLabel).toBe("1 producto disponible");
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

  it("opens and closes the Asociar productos picker, keeping it open while adding", () => {
    const opened = run([{ type: "open-moment", id: "desayunar" }, { type: "moment-open-product-picker" }]);
    expect(getMomentEditorView(opened)?.productPickerOpen).toBe(true);
    const added = organizationReducer(opened, { type: "moment-add-product", id: "limonada" });
    expect(getMomentEditorView(added)?.productPickerOpen).toBe(true);
    const closed = organizationReducer(added, { type: "moment-close-product-picker" });
    expect(closed.momentEditor).toMatchObject({ productPickerOpen: false, productQuery: "" });
    expect(organizationReducer(added, { type: "moment-discard" }).momentEditor?.productPickerOpen).toBe(false);
  });

  it("names a new moment in the breadcrumb and save bar", () => {
    const view = getMomentEditorView(run([{ type: "open-new-moment" }]));
    expect(view).toMatchObject({
      breadcrumb: ["CARTA DIGITAL", "MOMENTOS", "NUEVO MOMENTO"],
      order: 5,
      pendingLabel: "Momento nuevo sin guardar",
      saveBar: { title: "Momento nuevo sin guardar" },
    });
  });

  it("blocks saving with errors and shows them only after trying", () => {
    const state = run([
      { type: "open-moment", id: "desayunar" },
      { type: "moment-set-field", field: "title", value: "" },
    ]);
    expect(getMomentEditorView(state)?.errors).toEqual({});
    expect(getMomentEditorView(state)?.saveBar.blocked).toBe(false);
    const blocked = organizationReducer(state, { type: "moment-save" });
    expect(getMomentEditorView(blocked)?.errors).toEqual({ title: "Ingresá un nombre." });
    expect(getMomentEditorView(blocked)?.saveBar).toMatchObject({
      title: "Revisá los campos marcados antes de guardar.",
      blocked: true,
    });
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
    expect(view.metrics.map((metric) => [metric.label, metric.value, metric.detail])).toEqual([
      ["Categorías activas", 9, "Visibles en la carta"],
      ["Con productos", 8, "Contenido asignado"],
      ["Vacías", 1, "Requiere productos"],
    ]);
    expect(view.rows).toHaveLength(9);
    expect(view.rows[0]).toMatchObject({ label: "Cafés", productLabel: "4 productos", orderLabel: "01", contentLabel: "Con productos" });
    expect(view.filter).toBe("all");
    expect(view.page).toMatchObject({ page: 1, pageCount: 1, from: 1, to: 9, total: 9 });
    expect(view.footer).toBe("Mostrando 1–9 de 9 categorías · «Todos» se genera automáticamente");
  });

  it("pages 9 categories per page and resets the page on search or filter changes", () => {
    let state = onCategories();
    for (const label of ["Té", "Jugos", "Combos"]) {
      state = run(
        [
          { type: "open-new-category" },
          { type: "category-set-field", field: "label", value: label },
          saveCategory,
          { type: "close-editor" },
        ],
        state,
      );
    }
    expect(getCategoriesListView(state).footer).toBe("Mostrando 1–9 de 12 categorías · «Todos» se genera automáticamente");
    expect(getCategoriesListView(state).pageItems).toEqual([1, 2]);
    const second = organizationReducer(state, { type: "set-category-page", page: 2 });
    const view = getCategoriesListView(second);
    expect(view.rows.map((row) => [row.label, row.orderLabel])).toEqual([
      ["Té", "10"],
      ["Jugos", "11"],
      ["Combos", "12"],
    ]);
    expect(view.footer).toBe("Mostrando 10–12 de 12 categorías · «Todos» se genera automáticamente");
    expect(organizationReducer(second, { type: "set-category-query", query: "j" }).categoryPage).toBe(1);
    expect(organizationReducer(second, { type: "set-category-filter", filter: "hidden" }).categoryPage).toBe(1);
  });

  it("filters hidden categories", () => {
    const state = run(
      [
        { type: "open-category", id: "postres" },
        { type: "category-set-visible", visible: false },
        saveCategory,
        { type: "close-editor" },
        { type: "set-category-filter", filter: "hidden" },
      ],
      onCategories(),
    );
    const view = getCategoriesListView(state);
    expect(view.filter).toBe("hidden");
    expect(view.rows.map((row) => [row.label, row.visibilityLabel])).toEqual([["Postres", "Oculta"]]);
    expect(view.footer).toBe("Mostrando 1–1 de 1 categoría · «Todos» se genera automáticamente");
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

  it("disables the order chevrons at the ends and reordering while searching or filtering", () => {
    let state = onCategories();
    for (const label of ["Té", "Jugos", "Combos"]) {
      state = run(
        [{ type: "open-new-category" }, { type: "category-set-field", field: "label", value: label }, saveCategory, { type: "close-editor" }],
        state,
      );
    }
    const first = getCategoriesListView(state);
    expect(first.canReorder).toBe(true);
    expect(first.rows[0]).toMatchObject({ canMoveUp: false, canMoveDown: true });
    expect(first.rows[8]).toMatchObject({ canMoveUp: true, canMoveDown: true });
    const last = getCategoriesListView(organizationReducer(state, { type: "set-category-page", page: 2 }));
    expect(last.rows.at(-1)).toMatchObject({ label: "Combos", canMoveUp: true, canMoveDown: false });
    const searching = getCategoriesListView(run([{ type: "set-category-query", query: "a" }], state));
    expect(searching.canReorder).toBe(false);
    expect(searching.rows.every((row) => !row.canMoveUp && !row.canMoveDown)).toBe(true);
    expect(getCategoriesListView(run([{ type: "set-category-filter", filter: "visible" }], state)).canReorder).toBe(false);
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
      breadcrumb: ["CARTA DIGITAL", "CATEGORÍAS", "CAFÉS"],
      positionLabel: "01",
      pendingLabel: null,
      saveBar: { title: "Sin cambios", hint: "La categoría publicada no cambia hasta guardar." },
      image: { src: "/images/categories/cafes.jpg", fileName: "categoria-cafes.jpg", metaLabel: "700 × 467 px · 50 KB" },
      breakdown: { total: 4, visible: 4, unavailable: 0, moments: 3 },
      archiveCard: {
        title: "Archivar categoría",
        description: "Oculta la categoría sin eliminar productos ni historial.",
        actionLabel: "Revisar archivado",
      },
    });
    expect(getCategoryEditorView(state)).not.toHaveProperty("auditRules");
  });

  it("shows the image metadata and the last update relative to now", () => {
    const now = new Date(2026, 9, 26, 15, 0);
    const image = { src: "/images/x.jpg", fileName: "categoria-cafes.jpg", width: 1200, height: 600, bytes: 284 * 1024 };
    const state = run(
      [{ type: "open-category", id: "cafes" }, { type: "category-set-image", image }],
      createOrganizationState(undefined, now),
    );
    const view = getCategoryEditorView(state, now);
    expect(view).toMatchObject({
      pendingLabel: "Cambios sin guardar",
      saveBar: { title: "Cambios sin guardar" },
      image: { src: "/images/x.jpg", fileName: "categoria-cafes.jpg", metaLabel: "1200 × 600 px · 284 KB" },
    });
    expect(view?.contextLines.map((line) => line.text)).toEqual([
      "Última actualización: hoy, 10:32",
      "Editado por Sofía M.",
      "Permiso: Administradora",
    ]);
    const saved = organizationReducer(state, saveCategory);
    expect(getCategoryEditorView(saved, new Date(2026, 9, 27, 9, 0))?.contextLines[0].text).toBe(
      "Última actualización: ayer, 16:05",
    );
  });

  it("discards unsaved edits and clears a blocked save", () => {
    const blocked = run([
      { type: "open-category", id: "cafes" },
      { type: "category-set-field", field: "label", value: "" },
      saveCategory,
    ]);
    expect(getCategoryEditorView(blocked)?.saveBar.blocked).toBe(true);
    const discarded = organizationReducer(blocked, { type: "category-discard" });
    expect(discarded.categoryEditor?.draft.label).toBe("Cafés");
    expect(getCategoryEditorView(discarded)).toMatchObject({ dirty: false, pendingLabel: null, saveBar: { blocked: false } });
    expect(discarded.notice).toBe("Se descartaron los cambios.");
  });

  it("saves edits in memory and returns to the categories tab", () => {
    const saved = run([
      { type: "open-category", id: "cafes" },
      { type: "category-set-field", field: "label", value: "Café de especialidad" },
      { type: "category-set-visible", visible: false },
      saveCategory,
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
      saveCategory,
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
      breadcrumb: ["CARTA DIGITAL", "CATEGORÍAS", "NUEVA CATEGORÍA"],
      positionLabel: "10",
      pendingLabel: "Categoría nueva sin guardar",
      contextLines: [
        { kind: "updated", text: "Todavía no se guardó." },
        { kind: "permission", text: "Permiso: Administradora" },
      ],
    });
    const saved = run(
      [
        { type: "category-set-field", field: "label", value: "Té y tisanas" },
        saveCategory,
        { type: "close-editor" },
        // The tenth category opens the second 08C page.
        { type: "set-category-page", page: 2 },
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

  it("reviews the archive of an unused category before archiving it too", () => {
    const reviewed = run([
      { type: "open-new-category" },
      { type: "category-set-field", field: "label", value: "Té" },
      saveCategory,
      { type: "category-archive" },
    ]);
    expect(reviewed.view).toBe("category-editor");
    expect(getCategoryEditorView(reviewed)).toMatchObject({
      confirmingArchive: true,
      archiveTitle: "Archivar no afecta productos",
      archiveMessage: "Esta categoría no tiene productos ni momentos activos.",
    });
    const state = organizationReducer(reviewed, { type: "category-archive" });
    expect(state.view).toBe("categories");
    expect(getCategoriesListView(state).rows.map((row) => row.label)).not.toContain("Té");
  });
});

describe("customer explore preview (08E)", () => {
  it("previews the first visible moment from the lists and returns to the same tab", () => {
    const state = run([
      { type: "set-tab", tab: "categories" },
      { type: "set-moment-visibility", id: "desayunar", visible: false },
      { type: "open-preview" },
    ]);
    expect(state.view).toBe("preview");
    const view = getPreviewView(state);
    expect(view?.preview.title).toBe("Para merendar");
    expect(view?.preview.filters.map((filter) => filter.label)).toEqual(["Todos", "Cafés", "Panadería", "Tostados"]);
    expect(organizationReducer(state, { type: "close-preview" }).view).toBe("categories");
  });

  it("reflects saved changes to categories and moments", () => {
    const state = run([
      { type: "set-tab", tab: "categories" },
      { type: "move-category", id: "panaderia", step: -2 },
      { type: "open-category", id: "tostadas" },
      { type: "category-set-visible", visible: false },
      saveCategory,
      { type: "close-editor" },
      { type: "open-preview" },
      { type: "set-preview-filter", filterId: "panaderia" },
    ]);
    const view = getPreviewView(state);
    expect(view?.preview.filters.map((filter) => [filter.label, filter.active])).toEqual([
      ["Todos", false],
      ["Panadería", true],
      ["Cafés", false],
      ["Bebidas", false],
    ]);
    expect(view?.preview.products.map((product) => product.name)).toEqual(["Medialuna"]);
  });

  it("previews the unsaved draft from the moment editor and goes back to it", () => {
    const state = run([
      { type: "open-moment", id: "cenar" },
      { type: "moment-set-field", field: "title", value: "Cenas" },
      { type: "moment-add-product", id: "cheesecake" },
      { type: "moment-add-product", id: "limonada" },
      { type: "open-preview" },
    ]);
    const view = getPreviewView(state);
    expect(view?.preview.title).toBe("Cenas");
    expect(view?.preview.countLabel).toBe("5 productos disponibles");
    expect(view?.draft).toBe(true);
    expect(view?.canSwitchMoment).toBe(false);
    const back = organizationReducer(state, { type: "close-preview" });
    expect(back.view).toBe("moment-editor");
    expect(back.momentEditor?.draft.title).toBe("Cenas");
  });

  it("switches the moment, the device and derives the flow step and context", () => {
    const opened = run([{ type: "open-preview" }]);
    let view = getPreviewView(opened);
    expect(view).toMatchObject({
      device: "phone",
      canSwitchMoment: true,
      activeStep: "02",
      context: { moment: "Para desayunar", categories: 4, products: 7, filter: "Todos" },
    });
    expect(view?.momentOptions.map((option) => [option.label, option.active])).toEqual([
      ["Para desayunar", true],
      ["Para merendar", false],
      ["Para cenar", false],
      ["Para tomar", false],
    ]);
    expect(view?.flow.map((step) => [step.number, step.label, step.state])).toEqual([
      ["01", "Momento seleccionado", "Para desayunar"],
      ["02", "Categorías visibles", "Todos · Cafés · Tostadas · Panadería · Bebidas"],
      ["03", "Cambio de filtro", "Todos activo"],
      ["04", "Explorar productos", "Listado con scroll"],
      ["05", "Abrir detalle", "Café con leche"],
      ["06", "Regresar al listado", "Conserva el filtro"],
    ]);

    const filtered = run(
      [
        { type: "set-preview-filter", filterId: "cafes" },
        { type: "set-preview-device", device: "tablet" },
      ],
      opened,
    );
    view = getPreviewView(filtered);
    expect(view).toMatchObject({ device: "tablet", activeStep: "03", context: { products: 7, filter: "Cafés" } });
    expect(view?.flow[2].state).toBe("Cafés activo");

    const switched = organizationReducer(filtered, { type: "set-preview-moment", id: "cenar" });
    expect(switched.preview).toMatchObject({ momentId: "cenar", filterId: "todos", device: "tablet" });
    expect(getPreviewView(switched)?.context).toEqual({ moment: "Para cenar", categories: 3, products: 4, filter: "Todos" });
    expect(organizationReducer(switched, { type: "set-preview-moment", id: "missing" })).toBe(switched);
  });

  it("keeps a snapshot of the saved catalogue until Actualizar preview", () => {
    const opened = run([
      { type: "open-preview" },
      { type: "start-moment-visibility-save", id: "merendar", visible: false },
      { type: "finish-moment-visibility-save", id: "merendar", ok: true },
    ]);
    expect(getPreviewView(opened)?.momentOptions.map((option) => option.label)).toContain("Para merendar");
    const refreshed = organizationReducer(opened, { type: "refresh-preview" });
    expect(getPreviewView(refreshed)?.momentOptions.map((option) => option.label)).not.toContain("Para merendar");
    expect(refreshed.notice).toBe("Vista previa actualizada.");
  });

  it("shows an empty preview when no moment is visible", () => {
    const state = run([
      ...["desayunar", "merendar", "cenar", "tomar"].map(
        (id): OrganizationAction => ({ type: "set-moment-visibility", id, visible: false }),
      ),
      { type: "open-preview" },
    ]);
    expect(getPreviewView(state)?.preview.countLabel).toBe("0 productos disponibles");
    expect(getPreviewView(state)?.preview.title).toBe("");
  });
});

describe("async visibility switches (08A, 08C)", () => {
  it("shows a moment as updating, then commits it", () => {
    const pending = run([{ type: "start-moment-visibility-save", id: "merendar", visible: false }]);
    expect(pending.moments.find((moment) => moment.id === "merendar")?.visible).toBe(true);
    expect(getMomentsListView(pending).cards[1]).toMatchObject({
      visible: false,
      visibilityLabel: "Actualizando…",
      visibilityState: "pending",
    });
    expect(pending.notice).toBe("Actualizando la visibilidad de Para merendar…");
    // A second switch while saving is ignored.
    expect(organizationReducer(pending, { type: "start-moment-visibility-save", id: "merendar", visible: true })).toBe(
      pending,
    );

    const done = organizationReducer(pending, { type: "finish-moment-visibility-save", id: "merendar", ok: true });
    expect(getMomentsListView(done).cards[1]).toMatchObject({ visible: false, visibilityLabel: "Oculto", visibilityState: "idle" });
    expect(done.notice).toBe("Para merendar ya no se muestra en la carta.");
  });

  it("reverts a failed moment save with an error notice", () => {
    const failed = run([
      { type: "start-moment-visibility-save", id: "merendar", visible: false },
      { type: "finish-moment-visibility-save", id: "merendar", ok: false },
    ]);
    expect(getMomentsListView(failed).cards[1]).toMatchObject({
      visible: true,
      visibilityLabel: "Visible",
      visibilityState: "failed",
      visibilityError: "No se pudo guardar",
    });
    expect(failed.notice).toBe("No se pudo guardar la visibilidad de Para merendar.");
    const retried = organizationReducer(failed, { type: "start-moment-visibility-save", id: "merendar", visible: false });
    expect(getMomentsListView(retried).cards[1].visibilityState).toBe("pending");
  });

  it("toggles a category inline with the same pending and revert states", () => {
    const pending = run([
      { type: "set-tab", tab: "categories" },
      { type: "start-category-visibility-save", id: "postres", visible: false },
    ]);
    expect(getCategoriesListView(pending).rows[3]).toMatchObject({
      label: "Postres",
      visible: false,
      visibilityLabel: "Actualizando…",
      visibilityState: "pending",
    });
    const done = organizationReducer(pending, { type: "finish-category-visibility-save", id: "postres", ok: true });
    expect(getCategoriesListView(done).rows[3]).toMatchObject({ visible: false, visibilityLabel: "Oculta", visibilityState: "idle" });
    expect(done.notice).toBe("Postres ya no se muestra en la carta.");

    const failed = run([{ type: "finish-category-visibility-save", id: "postres", ok: false }], pending);
    expect(getCategoriesListView(failed).rows[3]).toMatchObject({
      visible: true,
      visibilityLabel: "Visible",
      visibilityError: "No se pudo guardar",
    });
    expect(failed.notice).toBe("No se pudo guardar la visibilidad de Postres.");
  });

  it("ignores switches that change nothing or unknown ids", () => {
    const state = createOrganizationState();
    expect(organizationReducer(state, { type: "start-moment-visibility-save", id: "desayunar", visible: true })).toBe(state);
    expect(organizationReducer(state, { type: "start-category-visibility-save", id: "nope", visible: false })).toBe(state);
    expect(organizationReducer(state, { type: "finish-moment-visibility-save", id: "desayunar", ok: true })).toBe(state);
  });
});
