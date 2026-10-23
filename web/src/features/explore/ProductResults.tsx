import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/mocks/types";
import { ProductListCard } from "./ProductListCard";

type ProductResultsProps = {
  products: Product[];
};

const pillAction =
  "flex h-9 shrink-0 items-center rounded-[18px] bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid";

/** Product count, sort/filter pills and the 2-column results grid. */
export function ProductResults({ products }: ProductResultsProps) {
  return (
    <>
      <div className="mt-[11px] flex h-10 items-center justify-between">
        <p className="text-[12px] font-semibold text-muted">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
        {/* Sort and filter are visual only in this prototype. */}
        <div className="flex gap-[7px]">
          <button type="button" className={`${pillAction} gap-1.5 px-[11px]`}>
            <ArrowUpDown size={14} aria-hidden="true" />
            <span className="text-[11px] font-semibold">Ordenar</span>
          </button>
          <button
            type="button"
            aria-label="Filtrar"
            className="flex size-9 items-center justify-center rounded-full bg-brand text-white"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3">
        {products.map((product, index) => (
          <ProductListCard key={product.id} product={product} eager={index < 2} />
        ))}
      </div>
    </>
  );
}
