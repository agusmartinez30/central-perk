"use client";

import { useReducer } from "react";
import { PRODUCTS } from "@/mocks/service-day";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { CustomerPreview } from "./CustomerPreview";
import { ProductCatalogTable } from "./ProductCatalogTable";
import { ProductEditor } from "./ProductEditor";
import { ProductListFilters } from "./ProductListFilters";
import { ProductListHeader } from "./ProductListHeader";
import { ProductListMetrics } from "./ProductListMetrics";
import {
  createProductsState,
  getEditorView,
  getProductsListView,
  productsReducer,
  setFilter,
  type ProductsAction,
  type ProductsState,
} from "./products-state";

/**
 * Forced variants: `edit` (07B: the Cappuccino with "Tomar" added and not saved yet), `preview`
 * (07C of that same draft), `new` (empty "Nuevo producto" form) and `errors` (the Cappuccino
 * after publishing without a name and with an invalid price; not in the exports).
 */
export const PRODUCTS_FORCED_STATES = ["edit", "preview", "new", "errors"] as const;

type ForcedState = (typeof PRODUCTS_FORCED_STATES)[number];

const EDITED_CAPPUCCINO: ProductsAction[] = [
  { type: "open-editor", id: "cappuccino" },
  { type: "toggle-moment", moment: "tomar" },
];

const FORCED_ACTIONS: Record<ForcedState, ProductsAction[]> = {
  edit: EDITED_CAPPUCCINO,
  preview: [...EDITED_CAPPUCCINO, { type: "open-preview" }],
  new: [{ type: "open-new" }],
  errors: [
    { type: "open-editor", id: "cappuccino" },
    { type: "set-field", field: "name", value: "" },
    { type: "set-field", field: "price", value: "3,8" },
    { type: "save", mode: "publish" },
  ],
};

function initProductsState(forcedState: ForcedState | null): ProductsState {
  const state = createProductsState(PRODUCTS);
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(productsReducer, state), notice: null };
}

/**
 * 07 · Productos. Container: owns the catalogue as edited in this session (pure
 * `productsReducer`, seeded from the canonical `PRODUCTS`) and which of the three views is open:
 * the list (07A), the editor (07B) or the customer preview (07C) of the editor's draft. Saving,
 * duplicating, archiving and the availability switches only change the in-memory list.
 */
export function ProductsScreen() {
  const forcedState = useScreenState(PRODUCTS_FORCED_STATES);
  const [state, dispatch] = useReducer(productsReducer, forcedState, initProductsState);
  const editorView = getEditorView(state);

  let content;
  if (state.editor && editorView && state.screen === "preview") {
    content = <CustomerPreview editor={state.editor} view={editorView} onAction={dispatch} />;
  } else if (state.editor && editorView && state.screen === "editor") {
    content = <ProductEditor editor={state.editor} view={editorView} onAction={dispatch} />;
  } else {
    const view = getProductsListView(state);
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[700px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
        <ProductListHeader onCreate={() => dispatch({ type: "open-new" })} />
        <ProductListMetrics metrics={view.metrics} />
        <ProductListFilters
          filters={state.filters}
          onQueryChange={(query) => dispatch({ type: "set-query", query })}
          onFilterChange={(filter, value) => dispatch(setFilter(filter, value))}
        />
        <ProductCatalogTable
          rows={view.rows}
          countLabel={view.countLabel}
          onEdit={(id) => dispatch({ type: "open-editor", id })}
          onDuplicate={(id) => dispatch({ type: "duplicate", id })}
          onArchive={(id) => dispatch({ type: "archive", id })}
          onRestore={(id) => dispatch({ type: "restore", id })}
          onAvailabilityChange={(id, available) => dispatch({ type: "set-availability", id, available })}
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
