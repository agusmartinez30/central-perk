"use client";

import { useCallback, useReducer } from "react";
import { Eye, Plus } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { CategoriesTable, CategoriesToolbar } from "./CategoriesTable";
import { CategoryEditor } from "./CategoryEditor";
import { ExplorePreviewPage } from "./ExplorePreviewPage";
import { MomentEditor } from "./MomentEditor";
import { MomentsGrid } from "./MomentsGrid";
import {
  CATEGORY_METRIC_TONES,
  HeaderAction,
  MetricStrip,
  MOMENT_METRIC_TONES,
  OrganizationTabs,
  PageHeader,
} from "./OrganizationParts";
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
  type OrganizationTab,
} from "./organization-state";
import { saveVisibility } from "./visibility-save";

/**
 * Forced variants: `moment-edit` (08B: Para desayunar with Limonada associated and not saved),
 * `moment-new` (empty "Crear momento" form), `moment-errors` (Para desayunar saved without a
 * name; not in the exports), `categories` (08C tab), `category-edit` (08D: Cafés with the export
 * description typed and not saved), `category-new` (empty "Crear categoría" form) and
 * `category-archive` (Cafés waiting for the archive confirmation; not in the exports) and
 * `preview` (08E of the first visible moment, Para desayunar).
 */
export const ORGANIZATION_FORCED_STATES = [
  "moment-edit",
  "moment-new",
  "moment-errors",
  "categories",
  "category-edit",
  "category-new",
  "category-archive",
  "preview",
] as const;

type ForcedState = (typeof ORGANIZATION_FORCED_STATES)[number];

const FORCED_ACTIONS: Record<ForcedState, OrganizationAction[]> = {
  "moment-edit": [
    { type: "open-moment", id: "desayunar" },
    { type: "moment-add-product", id: "limonada" },
  ],
  "moment-new": [{ type: "open-new-moment" }],
  "moment-errors": [
    { type: "open-moment", id: "desayunar" },
    { type: "moment-set-field", field: "title", value: "" },
    { type: "moment-save" },
  ],
  categories: [{ type: "set-tab", tab: "categories" }],
  "category-edit": [
    { type: "open-category", id: "cafes" },
    { type: "category-set-field", field: "description", value: "Espresso, filtrados y especialidades de la casa." },
  ],
  "category-new": [{ type: "open-new-category" }],
  "category-archive": [
    { type: "open-category", id: "cafes" },
    { type: "category-archive" },
  ],
  preview: [{ type: "open-preview" }],
};

function initState(forcedState: ForcedState | null): OrganizationState {
  const state = createOrganizationState();
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(organizationReducer, state), notice: null };
}

/**
 * 08 · Categorías y momentos. Container: owns the moments, categories and product assignments
 * as edited in this session (pure `organizationReducer`, seeded from the canonical catalogue)
 * and which view is open: the "Organización de la carta" tabs (08A moments, 08C categories) or
 * an editor (08B moment, 08D category) or the customer explore preview (08E). 07 keeps its own
 * session copy of the products.
 */
export function MenuOrganizationScreen() {
  const forcedState = useScreenState(ORGANIZATION_FORCED_STATES);
  const [state, dispatch] = useReducer(organizationReducer, forcedState, initState);

  const changeMomentVisibility = useCallback(async (id: string, visible: boolean) => {
    dispatch({ type: "start-moment-visibility-save", id, visible });
    try {
      await saveVisibility("moment", id, visible);
      dispatch({ type: "finish-moment-visibility-save", id, ok: true });
    } catch {
      dispatch({ type: "finish-moment-visibility-save", id, ok: false });
    }
  }, []);

  const changeCategoryVisibility = useCallback(async (id: string, visible: boolean) => {
    dispatch({ type: "start-category-visibility-save", id, visible });
    try {
      await saveVisibility("category", id, visible);
      dispatch({ type: "finish-category-visibility-save", id, ok: true });
    } catch {
      dispatch({ type: "finish-category-visibility-save", id, ok: false });
    }
  }, []);

  let content;
  const momentEditorView = getMomentEditorView(state);
  const categoryEditorView = getCategoryEditorView(state);
  const previewView = getPreviewView(state);
  const openPreview = () => dispatch({ type: "open-preview" });
  const changeTab = (tab: OrganizationTab) => dispatch({ type: "set-tab", tab });
  // Kept from the previous 08 (documented deviation): the exports do not show how 08E is reached.
  const previewAction = <HeaderAction label="Vista previa del cliente" icon={Eye} tone="neutral" onClick={openPreview} />;
  if (state.view === "preview" && previewView) {
    content = <ExplorePreviewPage view={previewView} onAction={dispatch} />;
  } else if (state.view === "moment-editor" && state.momentEditor && momentEditorView) {
    content = (
      <MomentEditor editor={state.momentEditor} view={momentEditorView} onAction={dispatch} onOpenPreview={openPreview} />
    );
  } else if (state.view === "category-editor" && state.categoryEditor && categoryEditorView) {
    content = <CategoryEditor editor={state.categoryEditor} view={categoryEditorView} onAction={dispatch} />;
  } else if (state.view === "categories") {
    const categories = getCategoriesListView(state);
    content = (
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
        <PageHeader
          title="Organización de la carta"
          subtitle="Gestioná categorías, visibilidad y orden de navegación."
          actions={
            <>
              {previewAction}
              <HeaderAction
                label="Crear categoría"
                icon={Plus}
                tone="primary"
                onClick={() => dispatch({ type: "open-new-category" })}
              />
            </>
          }
        />
        <MetricStrip label="Resumen de categorías" items={categories.metrics} tones={CATEGORY_METRIC_TONES} />
        <OrganizationTabs
          active="categories"
          onChange={changeTab}
          hint={
            categories.canReorder
              ? "Arrastrá o usá las flechas para ordenar"
              : "Limpiá la búsqueda y el filtro para ordenar"
          }
        >
          <CategoriesToolbar
            query={state.categoryQuery}
            onQueryChange={(query) => dispatch({ type: "set-category-query", query })}
            filter={categories.filter}
            filters={categories.filters}
            onFilterChange={(filter) => dispatch({ type: "set-category-filter", filter })}
          />
        </OrganizationTabs>
        <CategoriesTable
          view={categories}
          onEdit={(id) => dispatch({ type: "open-category", id })}
          onReorder={(id, toIndex) => dispatch({ type: "reorder-category", id, toIndex })}
          onMove={(id, step) => dispatch({ type: "move-category", id, step })}
          onVisibilityChange={changeCategoryVisibility}
          onArchive={(id) => {
            dispatch({ type: "open-category", id });
            dispatch({ type: "category-archive" });
          }}
          onPageChange={(page) => dispatch({ type: "set-category-page", page })}
        />
      </div>
    );
  } else {
    const moments = getMomentsListView(state);
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
        <PageHeader
          title="Organización de la carta"
          subtitle="Ordená los momentos en que los clientes exploran tu menú."
          actions={
            <>
              {previewAction}
              <HeaderAction
                label="Crear momento"
                icon={Plus}
                tone="primary"
                onClick={() => dispatch({ type: "open-new-moment" })}
              />
            </>
          }
        />
        <MetricStrip label="Resumen de momentos" items={moments.metrics} tones={MOMENT_METRIC_TONES} />
        <OrganizationTabs
          active="moments"
          onChange={changeTab}
          hint="Arrastrá para reordenar · También podés usar las flechas"
        />
        <MomentsGrid
          cards={moments.cards}
          onEdit={(id) => dispatch({ type: "open-moment", id })}
          onVisibilityChange={changeMomentVisibility}
          onReorder={(id, toIndex) => dispatch({ type: "reorder-moment", id, toIndex })}
          onMove={(id, step) => dispatch({ type: "move-moment", id, step })}
          onPreview={(id) => {
            dispatch({ type: "open-preview" });
            dispatch({ type: "set-preview-moment", id });
          }}
        />
      </div>
    );
  }

  return (
    <>
      {content}
      <p role="status" className="sr-only">
        {state.notice}
      </p>
    </>
  );
}
