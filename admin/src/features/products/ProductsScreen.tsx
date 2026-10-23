"use client";

import { useReducer } from "react";
import { PRODUCTS } from "@/mocks/service-day";
import { ProductCatalogTable } from "./ProductCatalogTable";
import { ProductListFilters } from "./ProductListFilters";
import { ProductListHeader } from "./ProductListHeader";
import { ProductListMetrics } from "./ProductListMetrics";
import { createProductsState, getProductsListView, productsReducer, setFilter } from "./products-state";

/**
 * 07 · Productos. Container: owns the catalogue as edited in this session (pure
 * `productsReducer`, seeded from the canonical `PRODUCTS`). Duplicating, archiving and the
 * availability switches only change the in-memory list.
 */
export function ProductsScreen() {
  const [state, dispatch] = useReducer(productsReducer, PRODUCTS, (products) => createProductsState(products));
  const view = getProductsListView(state);

  return (
    // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
    <div className="flex h-[calc(100dvh-72px)] min-h-[700px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
      {/* "Editar" and "Nuevo producto" open the editor (07B), wired with it. */}
      <ProductListHeader onCreate={() => {}} />
      <ProductListMetrics metrics={view.metrics} />
      <ProductListFilters
        filters={state.filters}
        onQueryChange={(query) => dispatch({ type: "set-query", query })}
        onFilterChange={(filter, value) => dispatch(setFilter(filter, value))}
      />
      <ProductCatalogTable
        rows={view.rows}
        countLabel={view.countLabel}
        onEdit={() => {}}
        onDuplicate={(id) => dispatch({ type: "duplicate", id })}
        onArchive={(id) => dispatch({ type: "archive", id })}
        onRestore={(id) => dispatch({ type: "restore", id })}
        onAvailabilityChange={(id, available) => dispatch({ type: "set-availability", id, available })}
      />
      <p role="status" className="sr-only">
        {state.notice}
      </p>
    </div>
  );
}
