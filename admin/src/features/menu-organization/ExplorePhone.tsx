import clsx from "clsx";
import { ArrowLeft, Armchair, Compass, Search, ShoppingBag } from "lucide-react";
import { ALL_FILTER_ID, type ExplorePreview } from "@/features/moments/moment-catalog";
import { ProductImage } from "@/features/products/ProductTags";
import { CoverImage } from "./OrganizationParts";

type ExplorePhoneProps = {
  preview: ExplorePreview;
  /** Accessible name of the phone region. */
  label: string;
  className?: string;
} & (
  | {
      /** 08E: 390px phone with the "Todos" + category filters and the bottom navigation. */
      variant?: "full";
      onFilterChange: (filterId: string) => void;
    }
  | {
      /** 08B "Moment Mobile Viewport": read-only 330px customer screen. */
      variant: "compact";
    }
);

/**
 * "Customer Preview" (08B) / "Explore Preview" (08E): the customer explore screen of a moment.
 * Text maps the 7–11px export copy to 11–13px.
 */
export function ExplorePhone(props: ExplorePhoneProps) {
  return props.variant === "compact" ? (
    <CompactExplorePhone preview={props.preview} label={props.label} className={props.className} />
  ) : (
    <FullExplorePhone {...props} />
  );
}

/**
 * 08B "Moment Mobile Viewport": device handle, café top bar with the back arrow, 165px hero,
 * title, description, the associated categories as chips (no "Todos", not interactive),
 * "Recomendados para vos" and a two-column card grid. The content scrolls inside the phone; no
 * bottom navigation.
 */
function CompactExplorePhone({ preview, label, className }: { preview: ExplorePreview; label: string; className?: string }) {
  const categories = preview.filters.filter((filter) => filter.id !== ALL_FILTER_ID);
  const title = preview.title || "Momento sin nombre";
  return (
    <section
      aria-label={label}
      className={clsx(
        "flex w-[330px] shrink-0 flex-col items-center overflow-hidden rounded-[22px] bg-[#fbfaf7] outline-1 -outline-offset-[0.5px] outline-[#d4d0c8]",
        className,
      )}
    >
      <span aria-hidden="true" className="my-[7px] h-1 w-[66px] shrink-0 rounded-[2px] bg-[#d4d0c8]" />
      <div aria-hidden="true" className="flex h-10 w-full shrink-0 items-center justify-between bg-surface px-3.5 text-ink">
        <ArrowLeft size={14} />
        <span className="text-[11px] font-bold tracking-[0.7px]">CAFÉ CENTRAL</span>
        <Search size={14} />
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto [scrollbar-width:thin]">
        <CoverImage src={preview.image} alt={`Portada de ${title}`} sizes="330px" className="h-[165px] w-full" />
        <div className="flex w-full flex-col gap-[9px] px-3.5 py-3">
          <p className="text-[19px] leading-tight font-bold text-ink">{title}</p>
          {preview.description && <p className="text-[11px] text-muted">{preview.description}</p>}
          {categories.length > 0 && (
            <ul aria-label="Categorías del momento" className="flex flex-wrap gap-[5px]">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex h-[23px] items-center rounded-xl bg-brand-wash px-2 text-[11px] font-bold whitespace-nowrap text-brand"
                >
                  {category.label}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] font-bold text-ink">Recomendados para vos</p>
          <ul className="grid grid-cols-2 gap-[7px]">
            {preview.products.map((product) => (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-nav bg-surface outline-1 -outline-offset-[0.5px] outline-line"
              >
                <ProductImage src={product.image} alt={product.name} sizes="144px" className="h-[78px] w-full" iconSize={18} />
                <div className="flex flex-col gap-0.5 p-[7px]">
                  <p className="truncate text-[11px] font-bold text-ink">{product.name}</p>
                  <p className="text-[11px] font-bold text-brand">{product.priceLabel}</p>
                  {!product.available && <p className="truncate text-[11px] text-warning">{product.description}</p>}
                </div>
              </li>
            ))}
            {preview.products.length === 0 && (
              <li className="col-span-2 text-[12px] text-muted">Este momento todavía no tiene productos publicados.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * 08E "Explore Preview": 390px phone with the moment cover, its description, the "Todos" +
 * category filters, the product count, two-column product cards and the bottom navigation. The
 * product cards scroll between the count and the navigation, which sits on the bottom edge (the
 * exports place it below the visible area).
 */
function FullExplorePhone({
  preview,
  onFilterChange,
  label,
  className,
}: {
  preview: ExplorePreview;
  onFilterChange: (filterId: string) => void;
  label: string;
  className?: string;
}) {
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
