import type { ConsumptionMomentId, Product, ProductCategoryId } from "@/mocks/service-day";
import {
  PRODUCT_STATUS_LABELS,
  createProductId,
  getProductStatus,
  type ProductStatus,
} from "./product-catalog";
import {
  EXTRAS_MAX_SELECTION,
  applyProductDraft,
  createEmptyDraft,
  getPreviewModel,
  getProductChanges,
  hasFormErrors,
  toProductDraft,
  validateProductDraft,
  type OptionDraft,
  type OptionGroupId,
  type PreviewModel,
  type ProductDraft,
  type ProductFormErrors,
  type SaveMode,
} from "./product-form";
import type { ProductsState } from "./products-state";

/** The 07B editor of one product (or of a new one). */
export type EditorState = {
  /** null while creating a product that was never saved. */
  productId: string | null;
  /** The product as last saved, in form shape, to tell what changed. */
  saved: ProductDraft;
  draft: ProductDraft;
  /** Mode of the last blocked save: its errors stay visible until a save succeeds or the draft is discarded. */
  attemptedMode: SaveMode | null;
  /** Option row in edit mode (pencil), if any. */
  editingOptionId: string | null;
  /** Next "opcion-N" id for added options. */
  nextOptionNumber: number;
};

export type EditorAction =
  | { type: "open-editor"; id: string }
  | { type: "open-new" }
  | { type: "close-editor" }
  | { type: "open-preview" }
  | { type: "close-preview" }
  | { type: "set-field"; field: "name" | "description" | "price"; value: string }
  | { type: "set-category"; categoryId: ProductCategoryId }
  | { type: "toggle-moment"; moment: ConsumptionMomentId }
  | { type: "set-draft-availability"; available: boolean }
  | { type: "set-customer-notes"; allow: boolean }
  | { type: "set-image"; image: string | undefined }
  | { type: "add-option"; group: OptionGroupId }
  | { type: "edit-option"; id: string }
  | { type: "finish-option-edit" }
  | { type: "update-option"; group: OptionGroupId; id: string; changes: Partial<Omit<OptionDraft, "id">> }
  | { type: "remove-option"; group: OptionGroupId; id: string }
  | { type: "save"; mode: SaveMode }
  | { type: "discard" };

export const BLOCKED_SAVE_MESSAGE = "Revisá los campos marcados antes de guardar.";

function openEditor(productId: string | null, draft: ProductDraft): EditorState {
  return {
    productId,
    saved: draft,
    draft,
    attemptedMode: null,
    editingOptionId: null,
    nextOptionNumber: 1,
  };
}

function withDraft(state: ProductsState, editor: EditorState, changes: Partial<ProductDraft>): ProductsState {
  return { ...state, editor: { ...editor, draft: { ...editor.draft, ...changes } } };
}

/** A product that was never saved; the draft is applied over it. */
function newProductBase(draft: ProductDraft, products: readonly Product[]): Product {
  return {
    id: createProductId(
      draft.name,
      products.map((product) => product.id),
    ),
    name: "",
    price: 0,
    categoryId: draft.categoryId || "cafes",
    description: "",
    moments: [],
    publication: "draft",
    available: true,
    archived: false,
    allowCustomerNotes: true,
    sizes: [],
    extras: [],
  };
}

function saveEditor(state: ProductsState, editor: EditorState, mode: SaveMode): ProductsState {
  const otherNames = state.products
    .filter((product) => !product.archived && product.id !== editor.productId)
    .map((product) => product.name);
  if (hasFormErrors(validateProductDraft(editor.draft, { mode, otherNames }))) {
    return { ...state, editor: { ...editor, attemptedMode: mode }, notice: BLOCKED_SAVE_MESSAGE };
  }
  const existing = state.products.find((product) => product.id === editor.productId);
  const product = applyProductDraft(editor.draft, existing ?? newProductBase(editor.draft, state.products), mode);
  const products = existing
    ? state.products.map((candidate) => (candidate.id === product.id ? product : candidate))
    : [...state.products, product];
  const saved = toProductDraft(product);
  return {
    ...state,
    products,
    version: state.version + 1,
    editor: { ...openEditor(product.id, saved), nextOptionNumber: editor.nextOptionNumber },
    notice:
      mode === "publish"
        ? `${product.name} se publicó en la carta.`
        : `${product.name} se guardó como borrador y no se muestra en la carta.`,
  };
}

/** Editor and preview actions of `productsReducer`. */
export function editorReducer(state: ProductsState, action: EditorAction): ProductsState {
  if (action.type === "open-editor") {
    const product = state.products.find((candidate) => candidate.id === action.id);
    if (!product) return state;
    return { ...state, screen: "editor", editor: openEditor(product.id, toProductDraft(product)), notice: null };
  }
  if (action.type === "open-new") {
    return { ...state, screen: "editor", editor: openEditor(null, createEmptyDraft()), notice: null };
  }
  const { editor } = state;
  if (!editor) return state;
  const { draft } = editor;

  switch (action.type) {
    case "close-editor":
      return { ...state, screen: "list", editor: null };
    case "open-preview":
      return { ...state, screen: "preview", editor: { ...editor, editingOptionId: null } };
    case "close-preview":
      return { ...state, screen: "editor" };
    case "set-field":
      return withDraft(state, editor, { [action.field]: action.value });
    case "set-category":
      return withDraft(state, editor, { categoryId: action.categoryId });
    case "toggle-moment": {
      const moments = draft.moments.includes(action.moment)
        ? draft.moments.filter((moment) => moment !== action.moment)
        : [...draft.moments, action.moment];
      return withDraft(state, editor, { moments });
    }
    case "set-draft-availability":
      return withDraft(state, editor, { available: action.available });
    case "set-customer-notes":
      return withDraft(state, editor, { allowCustomerNotes: action.allow });
    case "set-image":
      return withDraft(state, editor, { image: action.image });
    case "add-option": {
      const option: OptionDraft = { id: `opcion-${editor.nextOptionNumber}`, name: "", priceDelta: "0" };
      return {
        ...state,
        editor: {
          ...editor,
          draft: { ...draft, [action.group]: [...draft[action.group], option] },
          editingOptionId: option.id,
          nextOptionNumber: editor.nextOptionNumber + 1,
        },
      };
    }
    case "edit-option":
      return { ...state, editor: { ...editor, editingOptionId: action.id } };
    case "finish-option-edit":
      return { ...state, editor: { ...editor, editingOptionId: null } };
    case "update-option":
      return withDraft(state, editor, {
        [action.group]: draft[action.group].map((option) =>
          option.id === action.id ? { ...option, ...action.changes } : option,
        ),
      });
    case "remove-option":
      return {
        ...state,
        editor: {
          ...editor,
          draft: { ...draft, [action.group]: draft[action.group].filter((option) => option.id !== action.id) },
          editingOptionId: editor.editingOptionId === action.id ? null : editor.editingOptionId,
        },
      };
    case "save":
      return saveEditor(state, editor, action.mode);
    case "discard":
      return { ...state, editor: openEditor(editor.productId, editor.saved) };
  }
}

export type SaveTone = "neutral" | "warning" | "danger";

export type EditorView = {
  /** "Editar producto" or "Nuevo producto". */
  title: string;
  /** Last breadcrumb segment: the saved name, or "Nuevo producto". */
  breadcrumb: string;
  status: ProductStatus;
  statusLabel: string;
  changes: string[];
  dirty: boolean;
  /** Visible errors: only after a blocked save. */
  errors: ProductFormErrors;
  saveTitle: string;
  saveTone: SaveTone;
  /** "Versión 42 · validación requerida" or "Versión 42 · Publicado". */
  saveMeta: string;
  canSaveDraft: boolean;
  canPublish: boolean;
  /** "Selección única · Obligatorio". */
  sizesMeta: string;
  /** "Selección múltiple · Opcional · Máx. 3". */
  extrasMeta: string;
  /** 07C "Cappuccino publicado". */
  previewTitle: string;
  preview: PreviewModel;
};

const PREVIEW_STATUS: Record<ProductStatus, string> = {
  published: "publicado",
  draft: "en borrador",
  archived: "archivado",
};

export function getEditorView(state: ProductsState): EditorView | null {
  const { editor } = state;
  if (!editor) return null;
  const product = state.products.find((candidate) => candidate.id === editor.productId);
  const isNew = !product;
  const status: ProductStatus = product ? getProductStatus(product) : "draft";
  const changes = getProductChanges(editor.saved, editor.draft);
  const dirty = changes.length > 0;
  const otherNames = state.products
    .filter((candidate) => !candidate.archived && candidate.id !== editor.productId)
    .map((candidate) => candidate.name);
  const errors = editor.attemptedMode
    ? validateProductDraft(editor.draft, { mode: editor.attemptedMode, otherNames })
    : {};
  const blocked = hasFormErrors(errors);

  let saveTitle = "Producto sin cambios";
  let saveTone: SaveTone = "neutral";
  if (blocked) {
    saveTitle = BLOCKED_SAVE_MESSAGE;
    saveTone = "danger";
  } else if (dirty) {
    saveTitle = "Cambios sin guardar";
    saveTone = "warning";
  } else if (isNew) {
    saveTitle = "Producto nuevo sin guardar";
    saveTone = "warning";
  }

  return {
    title: isNew ? "Nuevo producto" : "Editar producto",
    breadcrumb: product?.name ?? "Nuevo producto",
    status,
    statusLabel: PRODUCT_STATUS_LABELS[status],
    changes,
    dirty,
    errors,
    saveTitle,
    saveTone,
    saveMeta: `Versión ${state.version} · ${dirty || isNew ? "validación requerida" : PRODUCT_STATUS_LABELS[status]}`,
    canSaveDraft: dirty || isNew,
    canPublish: dirty || isNew || status !== "published",
    sizesMeta: `Selección única · ${editor.draft.sizes.length > 0 ? "Obligatorio" : "Sin opciones"}`,
    extrasMeta: `Selección múltiple · Opcional · Máx. ${EXTRAS_MAX_SELECTION}`,
    previewTitle: product ? `${product.name} ${PREVIEW_STATUS[status]}` : "Nuevo producto sin guardar",
    preview: getPreviewModel(editor.draft),
  };
}
