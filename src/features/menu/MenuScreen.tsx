"use client";

import { useState } from "react";
import { CATEGORIES } from "@/mocks/menu";
import { TABLE } from "@/mocks/table";
import type { CategoryId } from "@/mocks/types";
import { CartFloatingCta } from "@/features/cart";
import { BottomDock, BottomNav, FilterChips, StatusBar } from "@/shared/ui";
import { MenuHeader } from "./MenuHeader";
import { PromoBanner } from "./PromoBanner";
import { ProductCard, ProductRow } from "./ProductCard";
import { formatOptionCount, getFeaturedProducts, getMenuSections } from "./menu-sections";

/** Screen 02 · Inicio del menú. Holds the selected category and renders the menu. */
export function MenuScreen() {
  const [category, setCategory] = useState<CategoryId>("todos");
  const sections = getMenuSections(category);
  const featured = category === "todos" ? getFeaturedProducts() : [];

  return (
    <>
      <StatusBar />
      <MenuHeader cafeName={TABLE.cafeName} table={TABLE.number} />
      <main className="flex flex-1 flex-col pt-1.5 pb-[164px]">
        <PromoBanner />

        <div className="sticky top-[62px] z-10 mt-2.5 flex flex-col gap-2.5 bg-cream px-4 pt-2 pb-2.5">
          <h2 className="font-display text-[25px] leading-none font-bold text-ink">
            ¿Qué se te antoja?
          </h2>
          <FilterChips
            label="Categorías"
            items={CATEGORIES}
            selected={category}
            onSelect={setCategory}
          />
        </div>

        <div className="mt-2 flex flex-col gap-3 px-4">
          {featured.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-[19px] font-bold tracking-[-0.4px] text-ink">
                Los favoritos del café
              </h2>
              <div className="flex gap-3">
                {featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}

          {sections.map(({ category: section, products }) => (
            <section key={section.id} className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[26px] leading-tight font-bold text-ink">
                  {section.label}
                </h2>
                <span className="text-[10px] font-bold text-muted">
                  {formatOptionCount(products.length)}
                </span>
              </div>
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </section>
          ))}
        </div>
      </main>
      <BottomDock>
        <CartFloatingCta variant="bag" />
        <BottomNav active="inicio" />
      </BottomDock>
    </>
  );
}
