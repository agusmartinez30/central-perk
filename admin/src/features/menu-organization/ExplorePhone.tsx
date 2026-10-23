import clsx from "clsx";
import { Armchair, Compass, ShoppingBag } from "lucide-react";
import type { ExplorePreview } from "@/features/moments/moment-catalog";
import { ProductImage } from "@/features/products/ProductTags";
import { CoverImage } from "./OrganizationParts";

type ExplorePhoneProps = {
  preview: ExplorePreview;
  onFilterChange: (filterId: string) => void;
  /** Accessible name of the phone region. */
  label: string;
  className?: string;
};

/**
 * "Customer Preview" (08B) / "Explore Preview" (08E): 390px phone with the moment cover, its
 * description, the "Todos" + category filters, the product count, two-column product cards and
 * the bottom navigation. Text maps the 8–11px export copy to 11–13px. The product cards scroll
 * between the count and the navigation, which sits on the bottom edge (the exports place it
 * below the visible area).
 */
export function ExplorePhone({ preview, onFilterChange, label, className }: ExplorePhoneProps) {
  return (
    <section
      aria-label={label}
      className={clsx(
        "relative w-[390px] shrink-0 overflow-hidden rounded-[30px] bg-cream outline-6 -outline-offset-[3px] outline-ink",
        className,
      )}
    >
      <p className="absolute top-[18px] left-[22px] text-[11px] font-bold text-ink">9:41</p>
      <CoverImage
        src={preview.image}
        alt={`Portada de ${preview.title || "momento sin nombre"}`}
        sizes="342px"
        className="absolute! top-12 left-[18px] h-[180px] w-[342px] rounded-2xl"
      >
        <span className="absolute bottom-4 left-4 max-w-[310px] truncate rounded-nav bg-ink/80 px-2.5 py-[7px] text-[18px] font-bold text-white">
          {preview.title || "Momento sin nombre"}
        </span>
      </CoverImage>
      <p className="absolute top-[242px] left-[18px] w-[342px] truncate text-[12px] text-muted">{preview.description}</p>
      <div
        role="group"
        aria-label="Filtros de categoría"
        className="absolute top-[274px] left-[18px] flex w-[354px] gap-1.5 overflow-x-auto pr-3"
      >
        {preview.filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={filter.active}
            onClick={() => onFilterChange(filter.id)}
            className={clsx(
              "flex h-[30px] shrink-0 items-center rounded-[15px] px-2.5 text-[11px] font-semibold whitespace-nowrap outline-1 -outline-offset-[0.5px]",
              filter.active ? "bg-brand text-white outline-brand" : "bg-surface text-ink outline-line hover:bg-sand",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <p className="absolute top-[324px] left-[18px] text-[11px] font-bold text-ink">{preview.countLabel}</p>
      <ul className="absolute top-[352px] bottom-[76px] left-[18px] grid w-[354px] auto-rows-[250px] grid-cols-[166px_166px] gap-3 overflow-y-auto pr-3 pb-1">
        {preview.products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line"
          >
            <ProductImage src={product.image} alt={product.name} sizes="166px" className="h-[140px] w-full" iconSize={22} />
            <div className="flex flex-col gap-1 p-2.5">
              <p className="line-clamp-2 text-[12px] font-bold text-ink">{product.name}</p>
              <p className="text-[12px] font-bold text-brand">{product.priceLabel}</p>
            </div>
          </li>
        ))}
        {preview.products.length === 0 && (
          <li className="col-span-2 text-[12px] text-muted">Este momento todavía no tiene productos publicados.</li>
        )}
      </ul>
      <nav
        aria-label="Navegación del cliente (vista previa)"
        className="absolute bottom-4 left-[18px] flex h-[50px] w-[342px] items-center justify-around rounded-[25px] bg-surface outline-1 -outline-offset-[0.5px] outline-line"
      >
        <Compass size={18} aria-label="Explorar" className="text-brand" />
        <ShoppingBag size={18} aria-label="Carrito" className="text-muted" />
        <Armchair size={18} aria-label="Mesa" className="text-muted" />
      </nav>
    </section>
  );
}
