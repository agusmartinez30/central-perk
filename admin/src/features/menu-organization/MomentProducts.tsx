"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { AssociatedProductRow } from "@/features/moments/moment-catalog";
import type { CatalogProductRef } from "@/features/categories/category-catalog";
import { ProductImage } from "@/features/products/ProductTags";
import { RowMenu } from "@/shared/ui";
import type { OrganizationAction } from "./organization-state";
import { SuggestionSearch } from "./SuggestionSearch";

type ProductPickerProps = {
  query: string;
  suggestions: CatalogProductRef[];
  onAction: (action: OrganizationAction) => void;
  /** Focus goes back here when the panel closes. */
  returnFocusTo: () => void;
};

/**
 * "Asociar productos" panel (no design in the export): a 320px popover under the button with
 * the product search of the previous 08B. Picking a product adds it and keeps the panel open
 * for the next one. Escape clears the query and, when it is empty, closes the panel; the close
 * button, the "Asociar productos" button and a click outside close it too.
 */
function ProductPicker({ query, suggestions, onAction, returnFocusTo }: ProductPickerProps) {
  const closeAndReturn = () => {
    onAction({ type: "moment-close-product-picker" });
    returnFocusTo();
  };

  return (
    <div
      role="dialog"
      aria-label="Asociar productos"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !query) closeAndReturn();
      }}
      className="absolute top-[calc(100%+6px)] right-0 z-30 flex w-80 flex-col gap-2.5 rounded-tile bg-surface p-3 shadow-modal outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-ink">Asociar productos</p>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={closeAndReturn}
          className="flex size-6 items-center justify-center rounded-nav text-muted hover:bg-cream hover:text-ink"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
      <SuggestionSearch
        label="Buscar productos existentes"
        placeholder="Buscar productos existentes…"
        value={query}
        suggestions={suggestions.map((product) => ({ id: product.id, label: product.name }))}
        emptyLabel="No hay productos sin asociar con ese nombre."
        onChange={(value) => onAction({ type: "moment-set-query", field: "product", value })}
        onPick={(id) => onAction({ type: "moment-add-product", id })}
        autoFocus
      />
      <p className="text-[11px] text-muted">Buscá por nombre para sumar productos del catálogo.</p>
    </div>
  );
}

type MomentProductsProps = {
  hint: string;
  rows: AssociatedProductRow[];
  pickerOpen: boolean;
  query: string;
  suggestions: CatalogProductRef[];
  onAction: (action: OrganizationAction) => void;
};

/**
 * 08B "Productos asociados": header with the count hint and "Asociar productos", and the
 * product rows (38px photo, name, category, availability, "Editar producto" and "…").
 */
export function MomentProducts({ hint, rows, pickerOpen, query, suggestions, onAction }: MomentProductsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // A press outside the button and its panel closes the picker.
  useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: Event) => {
      const target = event.target as Node | null;
      if (target && pickerRef.current?.contains(target)) return;
      onAction({ type: "moment-close-product-picker" });
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerOpen, onAction]);

  return (
    <section aria-labelledby="moment-products" className="flex min-h-[180px] w-full flex-1 flex-col gap-2.5">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 id="moment-products" className="text-[14px] font-bold text-ink">
            Productos asociados
          </h3>
          <p className="text-[11px] text-muted">{hint}</p>
        </div>
        <div ref={pickerRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
            onClick={() => onAction({ type: pickerOpen ? "moment-close-product-picker" : "moment-open-product-picker" })}
            className="flex h-[30px] items-center gap-[5px] rounded-[7px] bg-brand-wash px-[9px] text-brand hover:bg-brand/15"
          >
            <Plus size={12} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Asociar productos</span>
          </button>
          {pickerOpen && (
            <ProductPicker
              query={query}
              suggestions={suggestions}
              onAction={onAction}
              returnFocusTo={() => triggerRef.current?.focus()}
            />
          )}
        </div>
      </div>
      <ul
        aria-label="Productos asociados"
        className="min-h-0 flex-1 overflow-y-auto rounded-[9px] [scrollbar-width:thin] bg-[#faf9f6] outline-1 -outline-offset-[0.5px] outline-[#e9e6df]"
      >
        {rows.map((product, index) => (
          <li
            key={product.id}
            className={clsx("flex h-[55px] items-center gap-2.5 px-2.5", index % 2 === 1 ? "bg-surface" : "bg-[#faf9f6]")}
          >
            <ProductImage src={product.image} alt={product.name} sizes="38px" className="size-[38px] rounded-[7px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-[13px] font-bold text-ink">{product.name}</p>
              <p className="truncate text-[11px] text-muted">{product.categoryLabel}</p>
            </div>
            <span
              className={clsx(
                "flex h-[22px] shrink-0 items-center rounded-[11px] px-2 text-[11px] font-bold whitespace-nowrap",
                product.available ? "bg-success-bg text-success" : "bg-warning-bg text-warning",
              )}
            >
              {product.availabilityLabel}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/menu/products" className="text-[11px] font-bold text-brand hover:underline">
                Editar producto
              </Link>
              <RowMenu
                label={`Más acciones para ${product.name}`}
                open={menuFor === product.id}
                onOpenChange={(open) => setMenuFor(open ? product.id : null)}
                items={[
                  {
                    label: "Quitar del momento",
                    icon: X,
                    onSelect: () => onAction({ type: "moment-remove-product", id: product.id }),
                  },
                ]}
              />
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="p-3 text-[12px] text-muted">Usá «Asociar productos» para sumar productos a este momento.</li>
        )}
      </ul>
    </section>
  );
}
