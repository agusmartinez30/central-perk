"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import type { Moment } from "@/mocks/types";
import { CartFloatingCta } from "@/features/cart";
import { BottomDock, BottomNav, FilterChips } from "@/shared/ui";
import { ProductListCard } from "./ProductListCard";
import { getMomentProducts } from "./moment-products";

type ExploreResultsProps = {
  moment: Moment;
};

const pillAction =
  "flex h-9 shrink-0 items-center rounded-[18px] bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid";

/** Screen 02B · Explore results for one moment, with sub-filter chips. */
export function ExploreResults({ moment }: ExploreResultsProps) {
  const [filterId, setFilterId] = useState(moment.filters[0]?.id ?? "todos");
  const products = getMomentProducts(moment, filterId);

  return (
    <>
      <main className="flex flex-1 flex-col px-4 pt-2 pb-[164px]">
        <Link
          href="/explore"
          className="flex h-8 w-fit items-center gap-[7px] text-[10px] font-bold tracking-[0.8px] text-brand"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          TODOS LOS MOMENTOS
        </Link>

        <header className="mt-[5px] flex items-center justify-between">
          <h1 className="font-display text-[34px] leading-tight font-bold text-ink">{moment.title}</h1>
          {/* Search is visual only in this prototype. */}
          <button
            type="button"
            aria-label={`Buscar en ${moment.title.toLowerCase()}`}
            className="flex size-[38px] items-center justify-center rounded-full bg-surface text-ink"
          >
            <Search size={19} aria-hidden="true" />
          </button>
        </header>

        <FilterChips
          className="mt-[7px]"
          label={`Categorías de ${moment.title.toLowerCase()}`}
          items={moment.filters}
          selected={filterId}
          onSelect={setFilterId}
          weight="semibold"
        />

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
      </main>
      <BottomDock>
        <CartFloatingCta variant="count" />
        <BottomNav active="explorar" />
      </BottomDock>
    </>
  );
}
