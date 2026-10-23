import { CATALOG_VERSION, PRODUCTS } from "@/mocks/service-day";
import {
  createMenuCategories,
  getActiveCategories,
  type CatalogProductRef,
  type MenuCategory,
} from "@/features/categories/category-catalog";
import {
  ALL_FILTER_ID,
  addDraftCategory,
  addDraftProduct,
  applyMomentDraft,
  createEmptyMomentDraft,
  createMenuMoments,
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
import { nextOrder } from "@/shared/lib/ordering";

/** Lists are the two tabs of "Organización de la carta"; the editors are full pages. */
export type OrganizationTab = "moments" | "categories";
export type OrganizationView = OrganizationTab | "moment-editor";

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
  | { type: "set-preview-filter"; filterId: string };

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
      return { ...state, view: state.tab, momentEditor: null, notice: null };
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
      if (!state.momentEditor) return state;
      return { ...state, momentEditor: { ...state.momentEditor, previewFilter: action.filterId } };
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
  const active = new Map(getActiveCategories(state.categories).map((category) => [category.id, category]));
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
    selectedCategories: draft.categoryIds.flatMap((id) => active.get(id) ?? []),
    categorySuggestions: editor.categoryQuery.trim()
      ? searchAssignableCategories(draft, state.categories, editor.categoryQuery)
      : [],
    productsTitle: `Productos asociados · ${draft.productIds.length}`,
    products: getAssociatedProducts(draft, state.products),
    productSuggestions: searchAssignableProducts(draft, state.products, editor.productQuery),
    preview: getExplorePreview(draft, { products: state.products, categories: state.categories }, editor.previewFilter),
  };
}
