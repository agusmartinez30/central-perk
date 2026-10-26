import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import { BLOCKED_SAVE_MESSAGE } from "./product-editor-state";
import {
  createProductsState,
  getEditorView,
  getProductsListView,
  productsReducer,
  type ProductsAction,
  type ProductsState,
} from "./products-state";

const run = (...actions: ProductsAction[]): ProductsState =>
  actions.reduce(productsReducer, createProductsState(PRODUCTS));
const openCappuccino = (...actions: ProductsAction[]) => run({ type: "open-editor", id: "cappuccino" }, ...actions);
const editor = (state: ProductsState) => getEditorView(state)!;
const productOf = (state: ProductsState, id: string) => state.products.find((product) => product.id === id);

describe("product editor", () => {
  it("opens a product with a clean draft and the 07B copy", () => {
    const state = openCappuccino();
    expect(state.screen).toBe("editor");
    expect(editor(state)).toMatchObject({
      title: "Editar producto",
      breadcrumb: "Cappuccino",
      status: "published",
      statusLabel: "Publicado",
      dirty: false,
      changes: [],
      saveTitle: "Producto sin cambios",
      saveTone: "neutral",
      published: true,
      publicationLabel: "Publicado",
      primarySaveMode: "publish",
      optionGroups: [
        { id: "tamano", title: "Tamaño", meta: "Selección única · Obligatorio" },
        { id: "extras", title: "Extras", meta: "Selección múltiple · Máximo 2" },
      ],
      errors: {},
    });
    expect(editor(state).optionGroups[0].options.map((option) => option.id)).toEqual(["chico", "mediano", "grande"]);
    expect(editor(state).preview.addLabel).toBe("Agregar · $5.400");
  });

  it("returns null without an editor and ignores unknown products", () => {
    const state = createProductsState(PRODUCTS);
    expect(getEditorView(state)).toBeNull();
    expect(productsReducer(state, { type: "open-editor", id: "nope" })).toBe(state);
    expect(productsReducer(state, { type: "set-field", field: "name", value: "x" })).toBe(state);
  });

  it("marks the draft dirty as fields change and the preview follows the draft", () => {
    const state = openCappuccino(
      { type: "toggle-moment", moment: "tomar" },
      { type: "set-field", field: "price", value: "$4.800" },
    );
    expect(editor(state)).toMatchObject({
      dirty: true,
      changes: ["Precio base", "Momentos de consumo"],
      saveTitle: "Tenés cambios sin guardar",
      saveTone: "warning",
      saveHint: "La publicación actual no cambia hasta guardar.",
    });
    expect(editor(state).preview).toMatchObject({
      price: "$4.800",
      addLabel: "Agregar · $5.600",
      momentsLabel: "Desayunar · Merendar · Tomar",
    });
    expect(productOf(state, "cappuccino")?.price).toBe(4600);
  });

  it("toggles a moment off again", () => {
    const state = openCappuccino({ type: "toggle-moment", moment: "tomar" }, { type: "toggle-moment", moment: "tomar" });
    expect(editor(state).dirty).toBe(false);
  });

  it("edits category, notes, availability and image of the draft", () => {
    const state = openCappuccino(
      { type: "set-category", categoryId: "bebidas" },
      { type: "set-customer-notes", allow: false },
      { type: "set-draft-availability", available: false },
      { type: "set-image", image: undefined },
    );
    expect(editor(state).changes).toEqual([
      "Categoría",
      "Imagen principal",
      "Observaciones del cliente",
      "Disponibilidad",
    ]);
    expect(editor(state).preview).toMatchObject({ categoryLabel: "Bebidas", availabilityLabel: "No disponible" });
  });

  it("adds, edits and removes options, keeping a size preselected", () => {
    let state = openCappuccino({ type: "add-option", groupId: "extras" });
    expect(state.editor?.draft.optionGroups[1].options[3]).toEqual({ id: "opcion-1", name: "", priceDelta: "0" });
    expect(state.editor?.editingOptionId).toBe("opcion-1");
    state = productsReducer(state, {
      type: "update-option",
      groupId: "extras",
      id: "opcion-1",
      changes: { name: "Miel", priceDelta: "300" },
    });
    state = productsReducer(state, { type: "finish-option-edit" });
    expect(state.editor?.editingOptionId).toBeNull();
    expect(editor(state).preview.groups[1].options.at(-1)).toEqual({
      id: "opcion-1",
      name: "Miel",
      priceDelta: 300,
      priceLabel: "+$300",
      chipLabel: "Miel +$300",
      selected: false,
    });
    state = productsReducer(state, { type: "remove-option", groupId: "tamano", id: "mediano" });
    expect(editor(state).preview.groups[0].options.map(({ id, selected }) => ({ id, selected }))).toEqual([
      { id: "chico", selected: true },
      { id: "grande", selected: false },
    ]);
    expect(editor(state).changes).toEqual(["Tamaño", "Extras"]);
    state = productsReducer(state, { type: "edit-option", id: "grande" });
    expect(state.editor?.editingOptionId).toBe("grande");
    state = productsReducer(state, { type: "add-option", groupId: "tamano" });
    expect(state.editor?.draft.optionGroups[0].options.at(-1)?.id).toBe("opcion-2");
  });

  it("removes every size and says the group has no options", () => {
    const state = openCappuccino(
      { type: "remove-option", groupId: "tamano", id: "chico" },
      { type: "remove-option", groupId: "tamano", id: "mediano" },
      { type: "remove-option", groupId: "tamano", id: "grande" },
    );
    expect(editor(state).optionGroups[0].meta).toBe("Selección única · Sin opciones");
    expect(editor(state).preview.addLabel).toBe("Agregar · $4.600");
  });

  it("picks the preselected option of a required single group", () => {
    const state = openCappuccino({ type: "set-default-option", groupId: "tamano", optionId: "grande" });
    expect(editor(state).preview.addLabel).toBe("Agregar · $6.100");
    expect(editor(state).changes).toEqual(["Tamaño"]);
  });

  it("adds a group, renames it, configures it and fills it with options", () => {
    let state = openCappuccino({ type: "add-group" });
    expect(state.editor?.draft.optionGroups[2]).toEqual({
      id: "grupo-1",
      title: "",
      selection: "multiple",
      required: false,
      options: [],
    });
    expect(state.editor?.editingGroupId).toBe("grupo-1");
    const actions: ProductsAction[] = [
      { type: "rename-group", groupId: "grupo-1", title: "Leche" },
      { type: "finish-group-edit" },
      { type: "set-group-selection", groupId: "grupo-1", selection: "single" },
      { type: "set-group-required", groupId: "grupo-1", required: true },
      { type: "add-option", groupId: "grupo-1" },
      { type: "update-option", groupId: "grupo-1", id: "opcion-1", changes: { name: "Entera" } },
    ];
    state = actions.reduce(productsReducer, state);
    expect(state.editor?.editingGroupId).toBeNull();
    expect(editor(state).optionGroups[2]).toMatchObject({ title: "Leche", meta: "Selección única · Obligatorio" });
    expect(editor(state).preview.groups[2]).toMatchObject({
      title: "Leche",
      meta: "Obligatorio · Elegí 1",
      options: [{ id: "opcion-1", name: "Entera", priceLabel: "Incluido", selected: true }],
    });
    expect(editor(state).changes).toEqual(["Personalizaciones"]);
    state = productsReducer(state, { type: "add-group" });
    expect(state.editor?.draft.optionGroups.at(-1)?.id).toBe("grupo-2");
    state = productsReducer(state, { type: "save", mode: "publish" });
    expect(state.notice).toBe(BLOCKED_SAVE_MESSAGE);
    expect(editor(state).errors.optionGroups).toEqual({ "grupo-2": { title: "Ingresá el nombre del grupo." } });
  });

  it("switches selection and limits of a group, dropping what no longer applies", () => {
    let state = openCappuccino({ type: "set-group-max", groupId: "extras", max: 3 });
    expect(editor(state).optionGroups[1].meta).toBe("Selección múltiple · Máximo 3");
    state = productsReducer(state, { type: "set-group-selection", groupId: "extras", selection: "single" });
    expect(state.editor?.draft.optionGroups[1].max).toBeUndefined();
    state = productsReducer(state, { type: "set-group-selection", groupId: "tamano", selection: "multiple" });
    expect(state.editor?.draft.optionGroups[0].defaultOptionId).toBeUndefined();
    expect(editor(state).preview.addLabel).toBe("Agregar · $4.600");
  });

  it("removes a group and saves the product without it", () => {
    const state = openCappuccino({ type: "remove-group", groupId: "extras" }, { type: "save", mode: "publish" });
    expect(productOf(state, "cappuccino")?.optionGroups.map((group) => group.id)).toEqual(["tamano"]);
    expect(editor(state).dirty).toBe(false);
  });

  it("publishes the draft into the in-memory list and bumps the catalogue version", () => {
    const state = openCappuccino({ type: "toggle-moment", moment: "tomar" }, { type: "save", mode: "publish" });
    expect(productOf(state, "cappuccino")?.moments).toEqual(["desayunar", "merendar", "tomar"]);
    expect(state.version).toBe(43);
    expect(state.screen).toBe("editor");
    expect(editor(state)).toMatchObject({ dirty: false, status: "published", published: true });
    expect(state.notice).toBe("Cappuccino se publicó en la carta.");
  });

  it("saves as a draft, which takes the product out of the published menu", () => {
    const state = openCappuccino(
      { type: "set-field", field: "description", value: "Nueva descripción." },
      { type: "save", mode: "draft" },
    );
    expect(productOf(state, "cappuccino")).toMatchObject({ publication: "draft", description: "Nueva descripción." });
    expect(editor(state)).toMatchObject({
      status: "draft",
      statusLabel: "Borrador",
      published: false,
      publicationLabel: "No publicado",
      primarySaveMode: "draft",
    });
    expect(getProductsListView(state).metrics.published).toBe(11);
    expect(state.notice).toBe("Cappuccino se guardó como borrador y no se muestra en la carta.");
  });

  it("lets a clean draft be published once it is complete", () => {
    const state = run({ type: "open-editor", id: "cheesecake" });
    expect(editor(state)).toMatchObject({ dirty: false, published: false });
    const blocked = productsReducer(state, { type: "save", mode: "publish" });
    expect(editor(blocked).errors).toEqual({ image: "Agregá una imagen para publicar." });
    const published = productsReducer(
      productsReducer(blocked, { type: "set-image", image: "/images/products/cappuccino.webp" }),
      { type: "save", mode: "publish" },
    );
    expect(productOf(published, "cheesecake")?.publication).toBe("published");
    expect(editor(published).errors).toEqual({});
  });

  it("toggles the draft publication and saves with it from the primary action", () => {
    let state = openCappuccino({ type: "set-draft-publication", published: false });
    expect(editor(state)).toMatchObject({
      dirty: true,
      changes: ["Publicación"],
      published: false,
      publicationLabel: "No publicado",
      primarySaveMode: "draft",
      status: "published",
    });
    expect(productOf(state, "cappuccino")?.publication).toBe("published");
    state = productsReducer(state, { type: "save", mode: editor(state).primarySaveMode });
    expect(productOf(state, "cappuccino")?.publication).toBe("draft");
    state = productsReducer(state, { type: "set-draft-publication", published: true });
    expect(editor(state).primarySaveMode).toBe("publish");
    state = productsReducer(state, { type: "save", mode: editor(state).primarySaveMode });
    expect(productOf(state, "cappuccino")?.publication).toBe("published");
    expect(editor(state).dirty).toBe(false);
  });

  it("blocks an invalid save, shows every error and keeps the list", () => {
    const state = openCappuccino(
      { type: "set-field", field: "name", value: "Café latte" },
      { type: "set-field", field: "price", value: "abc" },
    );
    expect(editor(state).errors).toEqual({});
    const blocked = productsReducer(state, { type: "save", mode: "publish" });
    expect(blocked.products).toBe(state.products);
    expect(blocked.version).toBe(42);
    expect(editor(blocked)).toMatchObject({
      errors: { name: "Ya existe un producto con ese nombre.", price: "Ingresá un precio válido." },
      saveTitle: "Revisá los campos marcados antes de guardar.",
      saveTone: "danger",
    });
    expect(blocked.notice).toBe("Revisá los campos marcados antes de guardar.");
  });

  it("ignores names of archived products when checking duplicates", () => {
    const state = run(
      { type: "archive", id: "cafe-latte" },
      { type: "open-editor", id: "cappuccino" },
      { type: "set-field", field: "name", value: "Café latte" },
      { type: "save", mode: "publish" },
    );
    expect(productOf(state, "cappuccino")?.name).toBe("Café latte");
  });

  it("creates a new product, appended to the list and kept open in the editor", () => {
    let state = run({ type: "open-new" });
    expect(editor(state)).toMatchObject({
      title: "Nuevo producto",
      breadcrumb: "Nuevo producto",
      status: "draft",
      publicationLabel: "No publicado",
      dirty: false,
      optionGroups: [],
    });
    const actions: ProductsAction[] = [
      { type: "set-field", field: "name", value: "Té verde" },
      { type: "set-field", field: "price", value: "3500" },
      { type: "set-category", categoryId: "bebidas" },
      { type: "save", mode: "draft" },
    ];
    state = actions.reduce(productsReducer, state);
    expect(productOf(state, "te-verde")).toMatchObject({
      name: "Té verde",
      sku: "BEB-020",
      commercialRank: 14,
      price: 3500,
      publication: "draft",
      archived: false,
      moments: [],
      optionGroups: [],
    });
    expect(state.products.at(-1)?.id).toBe("te-verde");
    expect(state.editor?.productId).toBe("te-verde");
    expect(editor(state)).toMatchObject({ title: "Editar producto", dirty: false });
    expect(state.notice).toBe("Té verde se guardó como borrador y no se muestra en la carta.");
  });

  it("discards the draft and closes back to the list", () => {
    const dirty = openCappuccino({ type: "set-field", field: "name", value: "Otro" });
    expect(editor(productsReducer(dirty, { type: "discard" })).dirty).toBe(false);
    const closed = productsReducer(dirty, { type: "close-editor" });
    expect(closed.screen).toBe("list");
    expect(closed.editor).toBeNull();
    expect(productOf(closed, "cappuccino")?.name).toBe("Cappuccino");
  });

  it("opens the customer preview of the current draft and comes back to the editor", () => {
    const state = openCappuccino({ type: "toggle-moment", moment: "tomar" }, { type: "open-preview" });
    expect(state.screen).toBe("preview");
    expect(editor(state)).toMatchObject({ previewTitle: "Cappuccino publicado", dirty: true });
    expect(editor(state).preview.momentsLabel).toBe("Desayunar · Merendar · Tomar");
    const back = productsReducer(state, { type: "close-preview" });
    expect(back.screen).toBe("editor");
    expect(editor(back).dirty).toBe(true);
    expect(editor(run({ type: "open-editor", id: "cheesecake" })).previewTitle).toBe("Cheesecake en borrador");
    expect(editor(run({ type: "open-new" })).previewTitle).toBe("Nuevo producto sin guardar");
  });

  it("opens the editor of a duplicated product from the list", () => {
    const state = run({ type: "duplicate", id: "cappuccino" }, { type: "open-editor", id: "cappuccino-copia" });
    expect(editor(state)).toMatchObject({ breadcrumb: "Cappuccino (copia)", status: "draft" });
  });
});
