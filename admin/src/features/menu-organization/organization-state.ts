import { CATALOG_VERSION, PRODUCTS } from "@/mocks/service-day";
import {
  applyCategoryDraft,
  archiveCategory,
  countCategoryMoments,
  countCategoryProducts,
  createEmptyCategoryDraft,
  createMenuCategories,
  getActiveCategories,
  getArchiveImpact,
  getCategoryChanges,
  getCategoryMetrics,
  getCategoryRows,
  moveCategory,
  reorderCategories,
  toCategoryDraft,
  validateCategoryDraft,
  type CatalogProductRef,
  type CategoryDraft,
  type CategoryFormErrors,
  type CategoryMetrics,
  type CategoryRow,
  type MenuCategory,
} from "@/features/categories/category-catalog";
import {
  ALL_FILTER_ID,
  addDraftCategory,
  addDraftProduct,
  applyMomentDraft,
  createEmptyMomentDraft,
  createMenuMoments,
  getAssociatedCategories,
  getAssociatedProducts,
  getExplorePreview,
  getMomentCards,
  getMomentChanges,
  getMomentMetrics,
  moveMoment,
  removeDraftCategory,
  removeDraftProduct,
  reorderMoments,
  searchAssignableCategories,
  searchAssignableProducts,
  setMomentVisibility,
  toMomentDraft,
  validateMomentDraft,
  type AssociatedProductRow,
  type ExplorePreview,
  type MenuMoment,
  type MomentCard,
  type MomentDraft,
  type MomentFormErrors,
  type MomentMetrics,
} from "@/features/moments/moment-catalog";
import { formatOrderNumber, nextOrder, sortByOrder } from "@/shared/lib/ordering";

/** Lists are the two tabs of "Organización de la carta"; the editors are full pages. */
export type OrganizationTab = "moments" | "categories";
export type OrganizationView = OrganizationTab | "moment-editor" | "category-editor" | "preview";

/**
 * 08E "Vista previa del cliente": the saved catalogue (opened from the lists, first visible
 * moment) or the moment editor's unsaved draft ("Vista previa" of 08B).
 */
export type PreviewState = { momentId: string | null; fromEditor: boolean; filterId: string };

export type MomentEditorState = {
  /** `null` while creating a moment. */
  id: string | null;
  saved: MomentDraft;
  draft: MomentDraft;
  categoryQuery: string;
  productQuery: string;
  /** Errors show only after a blocked save. */
  submitted: boolean;
  /** Filter selected in the phone preview. */
  previewFilter: string;
};

export type CategoryEditorState = {
  /** `null` while creating a category. */
  id: string | null;
  saved: CategoryDraft;
  draft: CategoryDraft;
  submitted: boolean;
  /** "Archivar" was pressed once on a category in use and waits for the confirmation. */
  confirmingArchive: boolean;
};

export type OrganizationState = {
  view: OrganizationView;
  /** Tab the editors return to. */
  tab: OrganizationTab;
  moments: MenuMoment[];
  categories: MenuCategory[];
  /** Session copy of the catalogue: 08 rewrites `moments` assignments here, 07 keeps its own copy. */
  products: CatalogProductRef[];
  /** "versión 42", bumped by every save. */
  version: number;
  momentEditor: MomentEditorState | null;
  /** 08C "Buscar categoría…". */
  categoryQuery: string;
  categoryEditor: CategoryEditorState | null;
  preview: PreviewState | null;
  /** Screen-reader announcement of the last action. */
  notice: string | null;
};

export type OrganizationAction =
  | { type: "set-tab"; tab: OrganizationTab }
  | { type: "set-moment-visibility"; id: string; visible: boolean }
  | { type: "reorder-moment"; id: string; toIndex: number }
  | { type: "move-moment"; id: string; step: number }
  | { type: "open-moment"; id: string }
  | { type: "open-new-moment" }
  | { type: "close-editor" }
  | { type: "moment-set-field"; field: "title" | "description"; value: string }
  | { type: "moment-set-visible"; visible: boolean }
  | { type: "moment-set-image"; image: string | undefined }
  | { type: "moment-set-query"; field: "category" | "product"; value: string }
  | { type: "moment-add-category"; id: string }
  | { type: "moment-remove-category"; id: string }
  | { type: "moment-add-product"; id: string }
  | { type: "moment-remove-product"; id: string }
  | { type: "moment-discard" }
  | { type: "moment-save" }
  | { type: "set-preview-filter"; filterId: string }
  | { type: "set-category-query"; query: string }
  | { type: "reorder-category"; id: string; toIndex: number }
  | { type: "move-category"; id: string; step: number }
  | { type: "open-category"; id: string }
  | { type: "open-new-category" }
  | { type: "category-set-field"; field: "label" | "description"; value: string }
  | { type: "category-set-visible"; visible: boolean }
  | { type: "category-set-image"; image: string | undefined }
  | { type: "category-save" }
  | { type: "category-archive" }
  | { type: "category-cancel-archive" }
  | { type: "open-preview" }
  | { type: "close-preview" };

export function createOrganizationState(
  products: readonly CatalogProductRef[] = PRODUCTS,
): OrganizationState {
  return {
    view: "moments",
    tab: "moments",
    moments: createMenuMoments(),
    categories: createMenuCategories(),
    products: [...products],
    version: CATALOG_VERSION,
    momentEditor: null,
    categoryQuery: "",
    categoryEditor: null,
    preview: null,
    notice: null,
  };
}

const titleOf = (state: OrganizationState, id: string) =>
  state.moments.find((moment) => moment.id === id)?.title ?? "El momento";

function openMomentEditor(id: string | null, draft: MomentDraft): MomentEditorState {
  return {
    id,
    saved: draft,
    draft,
    categoryQuery: "",
    productQuery: "",
    submitted: false,
    previewFilter: ALL_FILTER_ID,
  };
}

function updateMomentDraft(
  state: OrganizationState,
  update: (draft: MomentDraft) => MomentDraft,
  extra: Partial<MomentEditorState> = {},
): OrganizationState {
  if (!state.momentEditor) return state;
  return { ...state, momentEditor: { ...state.momentEditor, ...extra, draft: update(state.momentEditor.draft) } };
}

const labelOf = (state: OrganizationState, id: string) =>
  state.categories.find((category) => category.id === id)?.label ?? "La categoría";

function openCategoryEditor(id: string | null, draft: CategoryDraft): CategoryEditorState {
  return { id, saved: draft, draft, submitted: false, confirmingArchive: false };
}

function updateCategoryDraft(state: OrganizationState, update: (draft: CategoryDraft) => CategoryDraft): OrganizationState {
  if (!state.categoryEditor) return state;
  return { ...state, categoryEditor: { ...state.categoryEditor, draft: update(state.categoryEditor.draft) } };
}

function saveCategory(state: OrganizationState): OrganizationState {
  const editor = state.categoryEditor;
  if (!editor) return state;
  const errors = validateCategoryDraft(editor.draft, { categories: state.categories, editingId: editor.id });
  if (Object.keys(errors).length > 0) {
    return {
      ...state,
      categoryEditor: { ...editor, submitted: true },
      notice: "Revisá los campos marcados antes de guardar.",
    };
  }
  const saved = applyCategoryDraft(state.categories, editor.id, editor.draft);
  const category = saved.categories.find((item) => item.id === saved.id);
  const draft = category ? toCategoryDraft(category) : editor.draft;
  return {
    ...state,
    categories: saved.categories,
    version: state.version + 1,
    categoryEditor: openCategoryEditor(saved.id, draft),
    notice: `${draft.label} se guardó.`,
  };
}

/**
 * "Archivar": a category in use asks once (the 08D warning turns into a confirmation); an unused
 * one, or the second press, archives it and returns to the list. Products and orders keep it.
 */
function archiveEditedCategory(state: OrganizationState): OrganizationState {
  const editor = state.categoryEditor;
  if (!editor?.id) return state;
  const impact = getArchiveImpact(
    countCategoryProducts(state.products, editor.id),
    countCategoryMoments(state.moments, editor.id),
  );
  if (impact.requiresConfirmation && !editor.confirmingArchive) {
    return {
      ...state,
      categoryEditor: { ...editor, confirmingArchive: true },
      notice: "Confirmá el archivo de la categoría.",
    };
  }
  return {
    ...state,
    view: "categories",
    tab: "categories",
    categories: archiveCategory(state.categories, editor.id),
    version: state.version + 1,
    categoryEditor: null,
    notice: `${labelOf(state, editor.id)} se archivó. Sus productos y pedidos no cambian.`,
  };
}

function saveMoment(state: OrganizationState): OrganizationState {
  const editor = state.momentEditor;
  if (!editor) return state;
  const errors = validateMomentDraft(editor.draft, { moments: state.moments, editingId: editor.id });
  if (Object.keys(errors).length > 0) {
    return {
      ...state,
      momentEditor: { ...editor, submitted: true },
      notice: "Revisá los campos marcados antes de guardar.",
    };
  }
  const saved = applyMomentDraft({ moments: state.moments, products: state.products }, editor.id, editor.draft);
  const moment = saved.moments.find((item) => item.id === saved.id);
  const draft = moment ? toMomentDraft(moment, saved.products) : editor.draft;
  return {
    ...state,
    moments: saved.moments,
    products: saved.products,
    version: state.version + 1,
    momentEditor: { ...openMomentEditor(saved.id, draft), previewFilter: editor.previewFilter },
    notice: `${draft.title} se guardó.`,
  };
}

export function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case "set-tab":
      return { ...state, view: action.tab, tab: action.tab, notice: null };
    case "set-moment-visibility":
      return {
        ...state,
        moments: setMomentVisibility(state.moments, action.id, action.visible),
        notice: action.visible
          ? `${titleOf(state, action.id)} se muestra en la carta.`
          : `${titleOf(state, action.id)} ya no se muestra en la carta.`,
      };
    case "reorder-moment":
    case "move-moment": {
      const moments =
        action.type === "reorder-moment"
          ? reorderMoments(state.moments, action.id, action.toIndex)
          : moveMoment(state.moments, action.id, action.step);
      const order = moments.find((moment) => moment.id === action.id)?.order;
      return { ...state, moments, notice: order ? `${titleOf(state, action.id)} pasó al orden ${order}.` : null };
    }
    case "open-moment": {
      const moment = state.moments.find((item) => item.id === action.id);
      if (!moment) return state;
      return {
        ...state,
        view: "moment-editor",
        tab: "moments",
        momentEditor: openMomentEditor(moment.id, toMomentDraft(moment, state.products)),
        notice: null,
      };
    }
    case "open-new-moment":
      return {
        ...state,
        view: "moment-editor",
        tab: "moments",
        momentEditor: openMomentEditor(null, createEmptyMomentDraft()),
        notice: null,
      };
    case "close-editor":
      return { ...state, view: state.tab, momentEditor: null, categoryEditor: null, notice: null };
    case "moment-set-field":
      return updateMomentDraft(state, (draft) => ({ ...draft, [action.field]: action.value }));
    case "moment-set-visible":
      return updateMomentDraft(state, (draft) => ({ ...draft, visible: action.visible }));
    case "moment-set-image":
      return updateMomentDraft(state, (draft) => ({ ...draft, image: action.image }));
    case "moment-set-query":
      if (!state.momentEditor) return state;
      return {
        ...state,
        momentEditor: {
          ...state.momentEditor,
          [action.field === "category" ? "categoryQuery" : "productQuery"]: action.value,
        },
      };
    case "moment-add-category":
      return updateMomentDraft(state, (draft) => addDraftCategory(draft, action.id), { categoryQuery: "" });
    case "moment-remove-category":
      return updateMomentDraft(state, (draft) => removeDraftCategory(draft, action.id));
    case "moment-add-product":
      return updateMomentDraft(state, (draft) => addDraftProduct(draft, action.id), { productQuery: "" });
    case "moment-remove-product":
      return updateMomentDraft(state, (draft) => removeDraftProduct(draft, action.id));
    case "moment-discard":
      if (!state.momentEditor) return state;
      return {
        ...state,
        momentEditor: { ...openMomentEditor(state.momentEditor.id, state.momentEditor.saved) },
        notice: "Se descartaron los cambios.",
      };
    case "moment-save":
      return saveMoment(state);
    case "set-preview-filter":
      if (state.preview && !state.preview.fromEditor) {
        return { ...state, preview: { ...state.preview, filterId: action.filterId } };
      }
      if (!state.momentEditor) return state;
      return { ...state, momentEditor: { ...state.momentEditor, previewFilter: action.filterId } };
    case "open-preview": {
      if (state.view === "moment-editor" && state.momentEditor) {
        return {
          ...state,
          view: "preview",
          preview: { momentId: state.momentEditor.id, fromEditor: true, filterId: state.momentEditor.previewFilter },
          notice: null,
        };
      }
      const first = sortByOrder(state.moments).find((moment) => moment.visible);
      return {
        ...state,
        view: "preview",
        preview: { momentId: first?.id ?? null, fromEditor: false, filterId: ALL_FILTER_ID },
        notice: null,
      };
    }
    case "close-preview":
      if (!state.preview) return state;
      return {
        ...state,
        view: state.preview.fromEditor && state.momentEditor ? "moment-editor" : state.tab,
        preview: null,
        notice: null,
      };
    case "set-category-query":
      return { ...state, categoryQuery: action.query };
    case "reorder-category":
    case "move-category": {
      const categories =
        action.type === "reorder-category"
          ? reorderCategories(state.categories, action.id, action.toIndex)
          : moveCategory(state.categories, action.id, action.step);
      const order = categories.find((category) => category.id === action.id)?.order;
      return {
        ...state,
        categories,
        notice: order ? `${labelOf(state, action.id)} pasó al orden ${formatOrderNumber(order)}.` : null,
      };
    }
    case "open-category": {
      const category = state.categories.find((item) => item.id === action.id);
      if (!category) return state;
      return {
        ...state,
        view: "category-editor",
        tab: "categories",
        categoryEditor: openCategoryEditor(category.id, toCategoryDraft(category)),
        notice: null,
      };
    }
    case "open-new-category":
      return {
        ...state,
        view: "category-editor",
        tab: "categories",
        categoryEditor: openCategoryEditor(null, createEmptyCategoryDraft()),
        notice: null,
      };
    case "category-set-field":
      return updateCategoryDraft(state, (draft) => ({ ...draft, [action.field]: action.value }));
    case "category-set-visible":
      return updateCategoryDraft(state, (draft) => ({ ...draft, visible: action.visible }));
    case "category-set-image":
      return updateCategoryDraft(state, (draft) => ({ ...draft, image: action.image }));
    case "category-save":
      return saveCategory(state);
    case "category-archive":
      return archiveEditedCategory(state);
    case "category-cancel-archive":
      if (!state.categoryEditor) return state;
      return { ...state, categoryEditor: { ...state.categoryEditor, confirmingArchive: false }, notice: null };
  }
}

export type MomentsListView = { metrics: MomentMetrics; cards: MomentCard[] };

export function getMomentsListView(state: OrganizationState): MomentsListView {
  return {
    metrics: getMomentMetrics(state.moments, state.categories),
    cards: getMomentCards({ moments: state.moments, products: state.products, categories: state.categories }),
  };
}

export type MomentEditorView = {
  title: string;
  statusLabel: string;
  /** Status bar tone: amber with unsaved changes (export), neutral otherwise. */
  dirty: boolean;
  canSave: boolean;
  canDiscard: boolean;
  publicationLabel: string;
  errors: MomentFormErrors;
  selectedCategories: MenuCategory[];
  categorySuggestions: MenuCategory[];
  productsTitle: string;
  products: AssociatedProductRow[];
  productSuggestions: CatalogProductRef[];
  preview: ExplorePreview;
};

export function getMomentEditorView(state: OrganizationState): MomentEditorView | null {
  const editor = state.momentEditor;
  if (!editor) return null;
  const { draft } = editor;
  const isNew = editor.id === null;
  const dirty = isNew || getMomentChanges(editor.saved, draft).length > 0;
  const order = isNew ? nextOrder(state.moments) : state.moments.find((moment) => moment.id === editor.id)?.order;
  let statusLabel = `Sin cambios · versión ${state.version}`;
  if (isNew) statusLabel = `Momento nuevo sin guardar · versión ${state.version}`;
  else if (dirty) statusLabel = `Cambios sin guardar · versión ${state.version}`;
  return {
    title: isNew ? "Crear momento" : "Editar momento",
    statusLabel,
    dirty,
    canSave: dirty,
    canDiscard: !isNew && dirty,
    publicationLabel: `${draft.visible ? "Visible en la carta" : "Oculto en la carta"} · Orden ${order ?? 1}`,
    errors: editor.submitted ? validateMomentDraft(draft, { moments: state.moments, editingId: editor.id }) : {},
    selectedCategories: getAssociatedCategories(draft.categoryIds, state.categories),
    categorySuggestions: editor.categoryQuery.trim()
      ? searchAssignableCategories(draft, state.categories, editor.categoryQuery)
      : [],
    productsTitle: `Productos asociados · ${draft.productIds.length}`,
    products: getAssociatedProducts(draft, state.products),
    productSuggestions: searchAssignableProducts(draft, state.products, editor.productQuery),
    preview: getExplorePreview(draft, { products: state.products, categories: state.categories }, editor.previewFilter),
  };
}

export type CategoriesListView = { metrics: CategoryMetrics; rows: CategoryRow[] };

export function getCategoriesListView(state: OrganizationState): CategoriesListView {
  return {
    metrics: getCategoryMetrics(state.categories, state.products),
    rows: getCategoryRows({
      categories: state.categories,
      products: state.products,
      moments: state.moments,
      query: state.categoryQuery,
    }),
  };
}

export type CategoryEditorView = {
  title: string;
  statusLabel: string;
  dirty: boolean;
  canSave: boolean;
  canArchive: boolean;
  settingsLabel: string;
  errors: CategoryFormErrors;
  /** "PRODUCTOS ASOCIADOS", derived from the product assignments. */
  productCount: number;
  archiveTitle: string;
  archiveMessage: string;
  confirmingArchive: boolean;
  auditRules: string[];
};

export function getCategoryEditorView(state: OrganizationState): CategoryEditorView | null {
  const editor = state.categoryEditor;
  if (!editor) return null;
  const isNew = editor.id === null;
  const dirty = isNew || getCategoryChanges(editor.saved, editor.draft).length > 0;
  const productCount = editor.id ? countCategoryProducts(state.products, editor.id) : 0;
  const impact = getArchiveImpact(productCount, editor.id ? countCategoryMoments(state.moments, editor.id) : 0);
  const order = isNew
    ? nextOrder(getActiveCategories(state.categories))
    : (state.categories.find((category) => category.id === editor.id)?.order ?? 1);
  let statusLabel = "Sin cambios · control de versión activo";
  if (isNew) statusLabel = "Categoría nueva sin guardar · control de versión activo";
  else if (dirty) statusLabel = "Cambios sin guardar · control de versión activo";
  return {
    title: isNew ? "Crear categoría" : "Editar categoría",
    statusLabel,
    dirty,
    canSave: dirty,
    canArchive: !isNew,
    settingsLabel: `${editor.draft.visible ? "Visible en la carta" : "Oculta en la carta"} · Orden ${formatOrderNumber(order)}`,
    errors: editor.submitted
      ? validateCategoryDraft(editor.draft, { categories: state.categories, editingId: editor.id })
      : {},
    productCount,
    archiveTitle: impact.requiresConfirmation ? "Archivar requiere confirmación" : "Archivar no afecta productos",
    archiveMessage: impact.message,
    confirmingArchive: editor.confirmingArchive,
    auditRules: [
      "✓ Los cambios quedan registrados en auditoría.",
      "✓ Los permisos se verifican en el servidor.",
      `✓ Versión actual: ${state.version} · evita sobrescrituras.`,
    ],
  };
}

export type PreviewView = {
  preview: ExplorePreview;
  /** The phone shows the moment editor's unsaved draft. */
  draft: boolean;
};

/** 08E phone: the editor draft, the chosen saved moment, or an empty phone without visible moments. */
export function getPreviewView(state: OrganizationState): PreviewView | null {
  const preview = state.preview;
  if (!preview) return null;
  const catalog = { products: state.products, categories: state.categories };
  if (preview.fromEditor && state.momentEditor) {
    return {
      preview: getExplorePreview(state.momentEditor.draft, catalog, state.momentEditor.previewFilter),
      draft: true,
    };
  }
  const moment = state.moments.find((item) => item.id === preview.momentId);
  const source = moment ? toMomentDraft(moment, state.products) : createEmptyMomentDraft();
  return { preview: getExplorePreview(source, catalog, preview.filterId), draft: false };
}
