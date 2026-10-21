"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import type { Moment } from "@/mocks/types";
import { CartFloatingCta } from "@/features/cart";
import { BottomDock, BottomNav, FilterChips } from "@/shared/ui";
import { ProductResults } from "./ProductResults";
import { getMomentProducts } from "./moment-products";

type ExploreResultsProps = {
  moment: Moment;
};

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

        <ProductResults products={products} />
      </main>
      <BottomDock>
        <CartFloatingCta variant="count" />
        <BottomNav active="explorar" />
      </BottomDock>
    </>
  );
}
