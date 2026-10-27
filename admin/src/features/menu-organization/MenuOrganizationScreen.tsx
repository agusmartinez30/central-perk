"use client";

import { useReducer } from "react";
import { Eye, Plus } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { CategoriesTable, CategoriesToolbar } from "./CategoriesTable";
import { CategoryEditor } from "./CategoryEditor";
import { ExplorePreviewPage } from "./ExplorePreviewPage";
import { MomentEditor } from "./MomentEditor";
import { MomentsGrid } from "./MomentsGrid";
import { MetricCards, OrganizationTabs, PageHeader } from "./OrganizationParts";
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

/** Entry to 08E from the lists (invented: the exports do not show how 08E is reached). */
function PreviewAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-[7px] rounded-field bg-surface px-3.5 text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
    >
      <Eye size={15} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">Vista previa del cliente</span>
    </button>
  );
}

type PrimaryActionProps = { label: string; onClick: () => void };

/** "Primary Action": 40px brand button, 10px label → 12px. */
function PrimaryAction({ label, onClick }: PrimaryActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-[7px] rounded-field bg-brand px-3.5 text-white hover:bg-brand/92"
    >
      <Plus size={15} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
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

  let content;
  const momentEditorView = getMomentEditorView(state);
  const categoryEditorView = getCategoryEditorView(state);
  const previewView = getPreviewView(state);
  const openPreview = () => dispatch({ type: "open-preview" });
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
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3 px-7 pt-[18px] pb-4">
        <PageHeader
          title="Organización de la carta"
          subtitle="Gestioná filtros de producto independientes de los momentos."
          actions={
            <>
              <PreviewAction onClick={openPreview} />
              <PrimaryAction label="Crear categoría" onClick={() => dispatch({ type: "open-new-category" })} />
            </>
          }
        />
        <MetricCards
          height="66"
          items={categories.metrics}
        />
        <OrganizationTabs active="categories" onChange={(tab) => dispatch({ type: "set-tab", tab })} />
        <CategoriesToolbar
          query={state.categoryQuery}
          onQueryChange={(query) => dispatch({ type: "set-category-query", query })}
        />
        <CategoriesTable
          rows={categories.rows}
          filtered={state.categoryQuery.trim().length > 0}
          onEdit={(id) => dispatch({ type: "open-category", id })}
          onReorder={(id, toIndex) => dispatch({ type: "reorder-category", id, toIndex })}
          onMove={(id, step) => dispatch({ type: "move-category", id, step })}
        />
      </div>
    );
  } else {
    const moments = getMomentsListView(state);
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3 px-7 pt-[18px] pb-4">
        <PageHeader
          title="Organización de la carta"
          subtitle="Definí cómo los clientes exploran tu menú."
          actions={
            <>
              <PreviewAction onClick={openPreview} />
              <PrimaryAction label="Crear momento" onClick={() => dispatch({ type: "open-new-moment" })} />
            </>
          }
        />
        <MetricCards
          height="74"
          items={moments.metrics}
        />
        <OrganizationTabs active="moments" onChange={(tab) => dispatch({ type: "set-tab", tab })} />
        <MomentsGrid
          cards={moments.cards}
          onEdit={(id) => dispatch({ type: "open-moment", id })}
          onVisibilityChange={(id, visible) => dispatch({ type: "set-moment-visibility", id, visible })}
          onReorder={(id, toIndex) => dispatch({ type: "reorder-moment", id, toIndex })}
          onMove={(id, step) => dispatch({ type: "move-moment", id, step })}
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
