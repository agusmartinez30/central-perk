import { CATALOG_VERSION, PRODUCTS, type ImageAsset } from "@/mocks/service-day";
import {
  CATEGORIES_PAGE_SIZE,
  CATEGORY_EDITOR,
  CATEGORY_STATUS_LABELS,
  CATEGORY_VISIBILITY_FILTERS,
  applyCategoryDraft,
  archiveCategory,
  countCategoryMoments,
  countCategoryProducts,
  createEmptyCategoryDraft,
  createMenuCategories,
  formatCategoriesFooter,
  formatCount,
  formatImageMetadata,
  getActiveCategories,
  getArchiveImpact,
  getCategoryChanges,
  getCategoryMetricItems,
  getCategoryProductBreakdown,
  getCategoryRows,
  moveCategory,
  reorderCategories,
  setCategoryVisibility,
  toCategoryDraft,
  validateCategoryDraft,
  type CatalogProductRef,
  type CategoryDraft,
  type CategoryFormErrors,
  type CategoryProductBreakdown,
  type CategoryRow,
  type CategoryVisibilityFilter,
  type MenuCategory,
  type MetricItem,
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
  getMomentMetricItems,
  getMomentProductSummary,
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
} from "@/features/moments/moment-catalog";
import { formatOrderNumber, nextOrder, sortByOrder } from "@/shared/lib/ordering";
import { getPageItems, paginate, type Page, type PageItem } from "@/shared/lib/pagination";
import { formatRelativeDayTime } from "@/shared/lib/relative-time";

/** Lists are the two tabs of "Organización de la carta"; the editors are full pages. */
export type OrganizationTab = "moments" | "categories";
export type OrganizationView = OrganizationTab | "moment-editor" | "category-editor" | "preview";

/** 08E viewport: the export shows the phone; the tablet option has no design. */
export type PreviewDevice = "phone" | "tablet";

/** The saved catalogue as the customer preview last read it ("Actualizar preview"). */
export type CatalogSnapshot = {
  moments: MenuMoment[];
  categories: MenuCategory[];
  products: CatalogProductRef[];
};

/**
 * 08E "Vista previa del cliente": a snapshot of the saved catalogue (opened from the lists,
 * first visible moment, switchable) or the moment editor's unsaved draft ("Vista previa" of 08B).
 */
export type PreviewState = {
  momentId: string | null;
  fromEditor: boolean;
  filterId: string;
  device: PreviewDevice;
  snapshot: CatalogSnapshot;
};

/**
 * A visibility switch being saved (`pending`, shows the requested value) or whose last save
 * failed (`failed`, back to the saved value with "No se pudo guardar"), as 07's availability.
 */
export type VisibilitySave = { status: "pending"; visible: boolean } | { status: "failed" };
export type VisibilityState = "idle" | "pending" | "failed";

export type MomentEditorState = {
  /** `null` while creating a moment. */
  id: string | null;
  saved: MomentDraft;
  draft: MomentDraft;
  categoryQuery: string;
  productQuery: string;
  /** "Asociar productos" picker (no design in the export). */
  productPickerOpen: boolean;
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
  /** "Revisar archivado" was pressed and the archive waits for the confirmation. */
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
  /** 08A card switches being saved or that failed, by moment id. */
  momentVisibilitySaves: Record<string, VisibilitySave>;
  momentEditor: MomentEditorState | null;
  /** 08C "Buscar categoría…". */
  categoryQuery: string;
  /** 08C visibility filter ("Todas"). */
  categoryFilter: CategoryVisibilityFilter;
  /** 08C page (1-based); the view clamps it to the available pages. */
  categoryPage: number;
  /** 08C inline switches being saved or that failed, by category id. */
  categoryVisibilitySaves: Record<string, VisibilitySave>;
  categoryEditor: CategoryEditorState | null;
  preview: PreviewState | null;
  /** Screen-reader announcement of the last action. */
  notice: string | null;
};

export type OrganizationAction =
  | { type: "set-tab"; tab: OrganizationTab }
  | { type: "set-moment-visibility"; id: string; visible: boolean }
  | { type: "start-moment-visibility-save"; id: string; visible: boolean }
  | { type: "finish-moment-visibility-save"; id: string; ok: boolean }
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
  | { type: "moment-open-product-picker" }
  | { type: "moment-close-product-picker" }
  | { type: "moment-add-product"; id: string }
  | { type: "moment-remove-product"; id: string }
  | { type: "moment-discard" }
  | { type: "moment-save" }
  | { type: "set-preview-filter"; filterId: string }
  | { type: "set-category-query"; query: string }
  | { type: "set-category-filter"; filter: CategoryVisibilityFilter }
  | { type: "set-category-page"; page: number }
  | { type: "start-category-visibility-save"; id: string; visible: boolean }
  | { type: "finish-category-visibility-save"; id: string; ok: boolean }
  | { type: "reorder-category"; id: string; toIndex: number }
  | { type: "move-category"; id: string; step: number }
  | { type: "open-category"; id: string }
  | { type: "open-new-category" }
  | { type: "category-set-field"; field: "label" | "description"; value: string }
  | { type: "category-set-visible"; visible: boolean }
  | { type: "category-set-image"; image: ImageAsset | undefined }
  /** `at`: ISO time of the save, recorded as the 08D "Última actualización". */
  | { type: "category-save"; at: string }
  | { type: "category-archive" }
  | { type: "category-cancel-archive" }
  | { type: "open-preview" }
  | { type: "close-preview" }
  | { type: "set-preview-moment"; id: string }
  | { type: "set-preview-device"; device: PreviewDevice }
  | { type: "refresh-preview" };

/** `now` dates the mock "Última actualización" of the seeded categories. */
export function createOrganizationState(
  products: readonly CatalogProductRef[] = PRODUCTS,
  now: Date = new Date(),
): OrganizationState {
  return {
    view: "moments",
    tab: "moments",
    moments: createMenuMoments(),
    categories: createMenuCategories(undefined, now),
    products: [...products],
    version: CATALOG_VERSION,
    momentVisibilitySaves: {},
    momentEditor: null,
    categoryQuery: "",
    categoryFilter: "all",
    categoryPage: 1,
    categoryVisibilitySaves: {},
    categoryEditor: null,
    preview: null,
    notice: null,
  };
}

const titleOf = (state: OrganizationState, id: string) =>
  state.moments.find((moment) => moment.id === id)?.title ?? "El momento";

const visibilityNotice = (name: string, visible: boolean) =>
  visible ? `${name} se muestra en la carta.` : `${name} ya no se muestra en la carta.`;

/** Saves with `id` set to pending, or `null` when there is nothing to save or it is already saving. */
function startSave(
  saves: Record<string, VisibilitySave>,
  item: { id: string; visible: boolean } | undefined,
  visible: boolean,
): Record<string, VisibilitySave> | null {
  if (!item || item.visible === visible || saves[item.id]?.status === "pending") return null;
  return { ...saves, [item.id]: { status: "pending", visible } };
}

function withoutSave(saves: Record<string, VisibilitySave>, id: string): Record<string, VisibilitySave> {
  return Object.fromEntries(Object.entries(saves).filter(([key]) => key !== id));
}

function openMomentEditor(id: string | null, draft: MomentDraft): MomentEditorState {
  return {
    id,
    saved: draft,
    draft,
    categoryQuery: "",
    productQuery: "",
    productPickerOpen: false,
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

function saveCategory(state: OrganizationState, at: string): OrganizationState {
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
  const saved = applyCategoryDraft(state.categories, editor.id, editor.draft, { at, by: CATEGORY_EDITOR.name });
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
 * "Revisar archivado" opens the confirmation (the impact message tells whether products or
 * moments use the category); confirming archives it and returns to the list. Products and
 * orders keep the category.
 */
function archiveEditedCategory(state: OrganizationState): OrganizationState {
  const editor = state.categoryEditor;
  if (!editor?.id) return state;
  if (!editor.confirmingArchive) {
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

const takeSnapshot = (state: OrganizationState): CatalogSnapshot => ({
  moments: state.moments,
  categories: state.categories,
  products: state.products,
});

const firstVisibleMoment = (moments: readonly MenuMoment[]) => sortByOrder(moments).find((moment) => moment.visible);

function finishMomentVisibilitySave(state: OrganizationState, id: string, ok: boolean): OrganizationState {
  const moment = state.moments.find((item) => item.id === id);
  const save = state.momentVisibilitySaves[id];
  if (!moment || save?.status !== "pending") return state;
  if (!ok) {
    return {
      ...state,
      momentVisibilitySaves: { ...state.momentVisibilitySaves, [id]: { status: "failed" } },
      notice: `No se pudo guardar la visibilidad de ${moment.title}.`,
    };
  }
  return {
    ...state,
    moments: setMomentVisibility(state.moments, id, save.visible),
    momentVisibilitySaves: withoutSave(state.momentVisibilitySaves, id),
    notice: visibilityNotice(moment.title, save.visible),
  };
}

function finishCategoryVisibilitySave(state: OrganizationState, id: string, ok: boolean): OrganizationState {
  const category = state.categories.find((item) => item.id === id);
  const save = state.categoryVisibilitySaves[id];
  if (!category || save?.status !== "pending") return state;
  if (!ok) {
    return {
      ...state,
      categoryVisibilitySaves: { ...state.categoryVisibilitySaves, [id]: { status: "failed" } },
      notice: `No se pudo guardar la visibilidad de ${category.label}.`,
    };
  }
  return {
    ...state,
    categories: setCategoryVisibility(state.categories, id, save.visible),
    categoryVisibilitySaves: withoutSave(state.categoryVisibilitySaves, id),
    notice: visibilityNotice(category.label, save.visible),
  };
}

function previewReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  const preview = state.preview;
  switch (action.type) {
    case "open-preview": {
      const snapshot = takeSnapshot(state);
      if (state.view === "moment-editor" && state.momentEditor) {
        return {
          ...state,
          view: "preview",
          preview: {
            momentId: state.momentEditor.id,
            fromEditor: true,
            filterId: state.momentEditor.previewFilter,
            device: "phone",
            snapshot,
          },
          notice: null,
        };
      }
      return {
        ...state,
        view: "preview",
        preview: {
          momentId: firstVisibleMoment(snapshot.moments)?.id ?? null,
          fromEditor: false,
          filterId: ALL_FILTER_ID,
          device: "phone",
          snapshot,
        },
        notice: null,
      };
    }
    case "close-preview":
      if (!preview) return state;
      return {
        ...state,
        view: preview.fromEditor && state.momentEditor ? "moment-editor" : state.tab,
        preview: null,
        notice: null,
      };
    case "set-preview-moment": {
      if (!preview || preview.fromEditor) return state;
      const moment = preview.snapshot.moments.find((item) => item.id === action.id && item.visible);
      if (!moment) return state;
      return { ...state, preview: { ...preview, momentId: moment.id, filterId: ALL_FILTER_ID } };
    }
    case "set-preview-device":
      if (!preview) return state;
      return { ...state, preview: { ...preview, device: action.device } };
    case "refresh-preview": {
      if (!preview) return state;
      const snapshot = takeSnapshot(state);
      const stillVisible = snapshot.moments.some((moment) => moment.id === preview.momentId && moment.visible);
      const momentId =
        preview.fromEditor || stillVisible ? preview.momentId : (firstVisibleMoment(snapshot.moments)?.id ?? null);
      return { ...state, preview: { ...preview, snapshot, momentId }, notice: "Vista previa actualizada." };
    }
    default:
      return state;
  }
}

export function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case "set-tab":
      return { ...state, view: action.tab, tab: action.tab, notice: null };
    case "set-moment-visibility":
      return {
        ...state,
        moments: setMomentVisibility(state.moments, action.id, action.visible),
        notice: visibilityNotice(titleOf(state, action.id), action.visible),
      };
    case "start-moment-visibility-save": {
      const moment = state.moments.find((item) => item.id === action.id);
      const saves = startSave(state.momentVisibilitySaves, moment, action.visible);
      if (!moment || !saves) return state;
      return { ...state, momentVisibilitySaves: saves, notice: `Actualizando la visibilidad de ${moment.title}…` };
    }
    case "finish-moment-visibility-save":
      return finishMomentVisibilitySave(state, action.id, action.ok);
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
    case "moment-open-product-picker":
      if (!state.momentEditor) return state;
      return { ...state, momentEditor: { ...state.momentEditor, productPickerOpen: true } };
    case "moment-close-product-picker":
      if (!state.momentEditor) return state;
      return { ...state, momentEditor: { ...state.momentEditor, productPickerOpen: false, productQuery: "" } };
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
    case "open-preview":
    case "close-preview":
    case "set-preview-moment":
    case "set-preview-device":
    case "refresh-preview":
      return previewReducer(state, action);
    case "set-category-query":
      return { ...state, categoryQuery: action.query, categoryPage: 1 };
    case "set-category-filter":
      return { ...state, categoryFilter: action.filter, categoryPage: 1 };
    case "set-category-page":
      return { ...state, categoryPage: action.page };
    case "start-category-visibility-save": {
      const category = getActiveCategories(state.categories).find((item) => item.id === action.id);
      const saves = startSave(state.categoryVisibilitySaves, category, action.visible);
      if (!category || !saves) return state;
      return { ...state, categoryVisibilitySaves: saves, notice: `Actualizando la visibilidad de ${category.label}…` };
    }
    case "finish-category-visibility-save":
      return finishCategoryVisibilitySave(state, action.id, action.ok);
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
      return saveCategory(state, action.at);
    case "category-archive":
      return archiveEditedCategory(state);
    case "category-cancel-archive":
      if (!state.categoryEditor) return state;
      return { ...state, categoryEditor: { ...state.categoryEditor, confirmingArchive: false }, notice: null };
  }
}

/** Switch state shared by 08A cards and 08C rows: a pending save shows the requested value. */
type SwitchView = { visible: boolean; visibilityState: VisibilityState; visibilityError?: string };

const UPDATING_LABEL = "Actualizando…";
const SAVE_ERROR_LABEL = "No se pudo guardar";

function switchView(visible: boolean, save: VisibilitySave | undefined): SwitchView {
  if (save?.status === "pending") return { visible: save.visible, visibilityState: "pending" };
  if (save?.status === "failed") return { visible, visibilityState: "failed", visibilityError: SAVE_ERROR_LABEL };
  return { visible, visibilityState: "idle" };
}

export type MomentListCard = MomentCard & Omit<SwitchView, "visible">;

export type MomentsListView = { metrics: MetricItem[]; cards: MomentListCard[] };

export function getMomentsListView(state: OrganizationState): MomentsListView {
  const cards = getMomentCards({ moments: state.moments, products: state.products, categories: state.categories });
  return {
    metrics: getMomentMetricItems(state.moments, state.products),
    cards: cards.map((card) => {
      const view = switchView(card.visible, state.momentVisibilitySaves[card.id]);
      return {
        ...card,
        ...view,
        visibilityLabel: view.visibilityState === "pending" ? UPDATING_LABEL : view.visible ? "Visible" : "Oculto",
      };
    }),
  };
}

/** 08B/08D save bar: title and the copy under it. */
export type SaveBarView = { title: string; hint: string };

export type MomentEditorView = {
  title: string;
  statusLabel: string;
  /** Status bar tone: amber with unsaved changes (export), neutral otherwise. */
  dirty: boolean;
  canSave: boolean;
  canDiscard: boolean;
  publicationLabel: string;
  /** "CARTA DIGITAL / MOMENTOS / PARA DESAYUNAR". */
  breadcrumb: string[];
  /** "ORDEN 1" tile. */
  order: number;
  /** Header badge ("Cambios sin guardar"); `null` without changes. */
  pendingLabel: string | null;
  saveBar: SaveBarView;
  errors: MomentFormErrors;
  selectedCategories: MenuCategory[];
  categorySuggestions: MenuCategory[];
  /** "4 seleccionadas · Se muestran en este momento". */
  categoriesHint: string;
  productsTitle: string;
  /** "18 productos · 16 visibles en la carta". */
  productsHint: string;
  products: AssociatedProductRow[];
  productPickerOpen: boolean;
  productSuggestions: CatalogProductRef[];
  preview: ExplorePreview;
};

export function getMomentEditorView(state: OrganizationState): MomentEditorView | null {
  const editor = state.momentEditor;
  if (!editor) return null;
  const { draft } = editor;
  const isNew = editor.id === null;
  const dirty = isNew || getMomentChanges(editor.saved, draft).length > 0;
  const order =
    (isNew ? nextOrder(state.moments) : state.moments.find((moment) => moment.id === editor.id)?.order) ?? 1;
  let statusLabel = `Sin cambios · versión ${state.version}`;
  if (isNew) statusLabel = `Momento nuevo sin guardar · versión ${state.version}`;
  else if (dirty) statusLabel = `Cambios sin guardar · versión ${state.version}`;
  let pendingLabel: string | null = null;
  if (isNew) pendingLabel = "Momento nuevo sin guardar";
  else if (dirty) pendingLabel = "Cambios sin guardar";
  const selectedCategories = getAssociatedCategories(draft.categoryIds, state.categories);
  return {
    title: isNew ? "Crear momento" : "Editar momento",
    statusLabel,
    dirty,
    canSave: dirty,
    canDiscard: !isNew && dirty,
    publicationLabel: `${draft.visible ? "Visible en la carta" : "Oculto en la carta"} · Orden ${order}`,
    breadcrumb: ["CARTA DIGITAL", "MOMENTOS", isNew ? "NUEVO MOMENTO" : editor.saved.title.toLocaleUpperCase("es")],
    order,
    pendingLabel,
    saveBar: {
      title: pendingLabel ?? "Sin cambios",
      hint: `Versión ${state.version} · La publicación actual no cambia hasta guardar`,
    },
    errors: editor.submitted ? validateMomentDraft(draft, { moments: state.moments, editingId: editor.id }) : {},
    selectedCategories,
    categorySuggestions: editor.categoryQuery.trim()
      ? searchAssignableCategories(draft, state.categories, editor.categoryQuery)
      : [],
    categoriesHint: `${formatCount(selectedCategories.length, "seleccionada", "seleccionadas")} · Se muestran en este momento`,
    productsTitle: `Productos asociados · ${draft.productIds.length}`,
    productsHint: getMomentProductSummary(draft.productIds, state.products),
    products: getAssociatedProducts(draft, state.products, state.categories),
    productPickerOpen: editor.productPickerOpen,
    productSuggestions: searchAssignableProducts(draft, state.products, editor.productQuery),
    preview: getExplorePreview(draft, { products: state.products, categories: state.categories }, editor.previewFilter),
  };
}

export type CategoryListRow = CategoryRow & Omit<SwitchView, "visible">;

export type CategoriesListView = {
  metrics: MetricItem[];
  filter: CategoryVisibilityFilter;
  filters: typeof CATEGORY_VISIBILITY_FILTERS;
  /** Rows of the current page. */
  rows: CategoryListRow[];
  page: Omit<Page<CategoryRow>, "items">;
  pageItems: PageItem[];
  /** "Mostrando 1–9 de 12 categorías · «Todos» se genera automáticamente". */
  footer: string;
};

export function getCategoriesListView(state: OrganizationState): CategoriesListView {
  const rows = getCategoryRows({
    categories: state.categories,
    products: state.products,
    moments: state.moments,
    query: state.categoryQuery,
    visibility: state.categoryFilter,
  });
  const { items, ...page } = paginate(rows, state.categoryPage, CATEGORIES_PAGE_SIZE);
  return {
    metrics: getCategoryMetricItems(state.categories, state.products),
    filter: state.categoryFilter,
    filters: CATEGORY_VISIBILITY_FILTERS,
    rows: items.map((row) => {
      const view = switchView(row.visible, state.categoryVisibilitySaves[row.id]);
      let visibilityLabel = view.visible ? CATEGORY_STATUS_LABELS.visible : CATEGORY_STATUS_LABELS.hidden;
      if (view.visibilityState === "pending") visibilityLabel = UPDATING_LABEL;
      return { ...row, ...view, visibilityLabel };
    }),
    page,
    pageItems: getPageItems(page.page, page.pageCount),
    footer: formatCategoriesFooter(page),
  };
}

export type CategoryEditorView = {
  title: string;
  statusLabel: string;
  dirty: boolean;
  canSave: boolean;
  canArchive: boolean;
  settingsLabel: string;
  /** "CARTA DIGITAL / CATEGORÍAS / CAFÉS". */
  breadcrumb: string[];
  /** "POSICIÓN 01". */
  positionLabel: string;
  pendingLabel: string | null;
  saveBar: SaveBarView;
  errors: CategoryFormErrors;
  /** "Imagen cargada": file name and "1200 × 600 px · 284 KB". */
  image: { src: string; fileName: string; metaLabel: string } | null;
  /** "PRODUCTOS ASOCIADOS", derived from the product assignments. */
  productCount: number;
  breakdown: CategoryProductBreakdown;
  /** "Información contextual" lines (mock update metadata). */
  contextLines: string[];
  /** "Archivar categoría" card; its action opens the confirmation. */
  archiveCard: { title: string; description: string; actionLabel: string };
  /** Confirmation copy, shown once "Revisar archivado" was pressed. */
  archiveTitle: string;
  archiveMessage: string;
  confirmingArchive: boolean;
};

const EMPTY_BREAKDOWN: CategoryProductBreakdown = { total: 0, visible: 0, unavailable: 0, moments: 0 };

/** `now` anchors the relative "Última actualización" ("hoy, 10:32"). */
export function getCategoryEditorView(state: OrganizationState, now: Date = new Date()): CategoryEditorView | null {
  const editor = state.categoryEditor;
  if (!editor) return null;
  const isNew = editor.id === null;
  const dirty = isNew || getCategoryChanges(editor.saved, editor.draft).length > 0;
  const category = state.categories.find((item) => item.id === editor.id);
  const productCount = editor.id ? countCategoryProducts(state.products, editor.id) : 0;
  const impact = getArchiveImpact(productCount, editor.id ? countCategoryMoments(state.moments, editor.id) : 0);
  const order = isNew ? nextOrder(getActiveCategories(state.categories)) : (category?.order ?? 1);
  let statusLabel = "Sin cambios · control de versión activo";
  if (isNew) statusLabel = "Categoría nueva sin guardar · control de versión activo";
  else if (dirty) statusLabel = "Cambios sin guardar · control de versión activo";
  let pendingLabel: string | null = null;
  if (isNew) pendingLabel = "Categoría nueva sin guardar";
  else if (dirty) pendingLabel = "Cambios sin guardar";
  const { image } = editor.draft;
  const permission = `Permiso: ${CATEGORY_EDITOR.role}`;
  return {
    title: isNew ? "Crear categoría" : "Editar categoría",
    statusLabel,
    dirty,
    canSave: dirty,
    canArchive: !isNew,
    settingsLabel: `${editor.draft.visible ? "Visible en la carta" : "Oculta en la carta"} · Orden ${formatOrderNumber(order)}`,
    breadcrumb: ["CARTA DIGITAL", "CATEGORÍAS", isNew ? "NUEVA CATEGORÍA" : editor.saved.label.toLocaleUpperCase("es")],
    positionLabel: formatOrderNumber(order),
    pendingLabel,
    saveBar: { title: pendingLabel ?? "Sin cambios", hint: "La categoría publicada no cambia hasta guardar." },
    errors: editor.submitted
      ? validateCategoryDraft(editor.draft, { categories: state.categories, editingId: editor.id })
      : {},
    image: image ? { src: image.src, fileName: image.fileName, metaLabel: formatImageMetadata(image) } : null,
    productCount,
    breakdown: editor.id ? getCategoryProductBreakdown(state.products, state.moments, editor.id) : EMPTY_BREAKDOWN,
    contextLines: category
      ? [
          `Última actualización: ${formatRelativeDayTime(category.updatedAt, now)}`,
          `Editado por ${category.updatedBy}`,
          permission,
        ]
      : ["Todavía no se guardó.", permission],
    archiveCard: {
      title: "Archivar categoría",
      description: "Oculta la categoría sin eliminar productos ni historial.",
      actionLabel: "Revisar archivado",
    },
    archiveTitle: impact.requiresConfirmation ? "Archivar requiere confirmación" : "Archivar no afecta productos",
    archiveMessage: impact.message,
    confirmingArchive: editor.confirmingArchive,
  };
}

/** 08E "Recorrido prototipado" step. */
export type PreviewFlowStep = { number: string; label: string; state: string; active: boolean };

export type PreviewView = {
  preview: ExplorePreview;
  /** The phone shows the moment editor's unsaved draft. */
  draft: boolean;
  device: PreviewDevice;
  /** "MOMENTO SELECCIONADO" can change only when previewing the saved catalogue. */
  canSwitchMoment: boolean;
  /** Visible moments of the snapshot, in display order. */
  momentOptions: { id: string; label: string; active: boolean }[];
  /** "Contexto de exploración". */
  context: { moment: string; categories: number; products: number; filter: string };
  flow: PreviewFlowStep[];
  /** Current step of the flow: "02" on "Todos", "03" once a category filter is applied. */
  activeStep: string;
};

/**
 * 08E: the editor draft, the chosen moment of the snapshot, or an empty phone without visible
 * moments. The six flow steps follow the export; only 02 (categories shown) and 03 (filter
 * changed) can be current, because the prototype has no product detail to open.
 */
export function getPreviewView(state: OrganizationState): PreviewView | null {
  const preview = state.preview;
  if (!preview) return null;
  const fromEditor = preview.fromEditor && state.momentEditor !== null;
  let source: MomentDraft;
  let filterId: string;
  let catalog: { products: readonly CatalogProductRef[]; categories: readonly MenuCategory[] };
  if (fromEditor && state.momentEditor) {
    source = state.momentEditor.draft;
    filterId = state.momentEditor.previewFilter;
    catalog = { products: state.products, categories: state.categories };
  } else {
    const { snapshot } = preview;
    const moment = snapshot.moments.find((item) => item.id === preview.momentId);
    source = moment ? toMomentDraft(moment, snapshot.products) : createEmptyMomentDraft();
    filterId = preview.filterId;
    catalog = snapshot;
  }
  const explore = getExplorePreview(source, catalog, filterId);
  const active = explore.filters.find((filter) => filter.active) ?? explore.filters[0];
  const filtering = active.id !== ALL_FILTER_ID;
  const all = filtering ? getExplorePreview(source, catalog, ALL_FILTER_ID) : explore;
  const activeStep = filtering ? "03" : "02";
  const steps: Omit<PreviewFlowStep, "active">[] = [
    { number: "01", label: "Momento seleccionado", state: explore.title || "Sin momento visible" },
    { number: "02", label: "Categorías visibles", state: explore.filters.map((filter) => filter.label).join(" · ") },
    { number: "03", label: "Cambio de filtro", state: `${active.label} activo` },
    { number: "04", label: "Explorar productos", state: "Listado con scroll" },
    { number: "05", label: "Abrir detalle", state: explore.products[0]?.name ?? "Sin productos" },
    { number: "06", label: "Regresar al listado", state: "Conserva el filtro" },
  ];
  return {
    preview: explore,
    draft: fromEditor,
    device: preview.device,
    canSwitchMoment: !fromEditor,
    momentOptions: fromEditor
      ? []
      : sortByOrder(preview.snapshot.moments)
          .filter((moment) => moment.visible)
          .map((moment) => ({ id: moment.id, label: moment.title, active: moment.id === preview.momentId })),
    context: {
      moment: explore.title,
      categories: explore.filters.length - 1,
      products: all.products.length,
      filter: active.label,
    },
    flow: steps.map((step) => ({ ...step, active: step.number === activeStep })),
    activeStep,
  };
}
