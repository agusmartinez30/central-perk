import clsx from "clsx";
import {
  ArrowLeft,
  House,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
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
      /** Stretch the phone layout over the whole stage (08E tablet toggle). */
      wide?: boolean;
    }
  | {
      /** 08B "Moment Mobile Viewport": read-only 330px customer screen. */
      variant: "compact";
    }
);

/**
 * "Customer Preview" (08B) / "Explore Preview" (08E): the customer explore screen of a moment.
 * Text maps the 7–16px export copy to 11–19px.
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
 * 08E "Premium Explore Viewport": device handle, café top bar, 140px moment hero with its title
 * label, then the scrollable content ("Elegí algo rico", the product count, "Todos" + category
 * filters and two-column cards with a description line; unavailable products stay listed, faded,
 * with "Temporalmente agotado") and the complete bottom navigation. `wide` stretches the same
 * layout over the stage (tablet toggle, which has no design of its own).
 */
function FullExplorePhone({
  preview,
  onFilterChange,
  label,
  wide = false,
  className,
}: {
  preview: ExplorePreview;
  onFilterChange: (filterId: string) => void;
  label: string;
  wide?: boolean;
  className?: string;
}) {
  const title = preview.title || "Momento sin nombre";
  return (
    <section
      aria-label={label}
      className={clsx(
        "flex min-h-0 shrink-0 flex-col items-center overflow-hidden rounded-[22px] bg-[#fbfaf7] shadow-[0_5px_16px_#10101014] outline-1 -outline-offset-[0.5px] outline-[#cfcbc3]",
        wide ? "w-full" : "w-[390px]",
        className,
      )}
    >
      <span aria-hidden="true" className="my-[7px] h-1 w-[68px] shrink-0 rounded-[2px] bg-[#d4d0c8]" />
      <div aria-hidden="true" className="flex h-10 w-full shrink-0 items-center justify-between bg-surface px-3.5 text-ink">
        <Menu size={14} />
        <span className="text-[11px] font-bold tracking-[0.7px]">CAFÉ CENTRAL</span>
        <Search size={14} />
      </div>
      <CoverImage src={preview.image} alt={`Portada de ${title}`} sizes={wide ? "498px" : "390px"} className="h-[140px] w-full">
        <span className="absolute bottom-3.5 left-3.5 flex h-[34px] max-w-[calc(100%-28px)] items-center rounded-[9px] bg-ink/72 px-2.5">
          <span className="truncate text-[15px] font-bold text-white">{title}</span>
        </span>
      </CoverImage>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[9px] overflow-y-auto px-[13px] py-[11px] [scrollbar-width:thin]">
        <div className="flex w-full items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-[18px] leading-tight font-bold text-ink">Elegí algo rico</p>
            <p className="text-[11px] text-muted">{preview.countLabel}</p>
          </div>
          <SlidersHorizontal size={14} aria-hidden="true" className="mb-0.5 text-ink" />
        </div>
        <div role="group" aria-label="Filtros de categoría" className="flex w-full shrink-0 gap-[5px] overflow-x-auto pb-0.5">
          {preview.filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={filter.active}
              onClick={() => onFilterChange(filter.id)}
              className={clsx(
                "flex h-7 shrink-0 items-center rounded-full px-[11px] text-[11px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px] focus-visible:outline-2 focus-visible:outline-brand",
                filter.active ? "bg-brand text-white outline-brand" : "bg-surface text-muted outline-line hover:text-ink",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <ul className={clsx("grid w-full gap-[7px]", wide ? "grid-cols-3" : "grid-cols-2")}>
          {preview.products.map((product) => (
            <li
              key={product.id}
              className={clsx(
                "flex flex-col overflow-hidden rounded-[9px] bg-surface outline-1 -outline-offset-[0.5px] outline-line",
                !product.available && "opacity-70",
              )}
            >
              <ProductImage src={product.image} alt={product.name} sizes="180px" className="h-[88px] w-full" iconSize={18} />
              <div className="flex flex-col gap-0.5 p-[7px]">
                <p className="truncate text-[12px] font-bold text-ink">{product.name}</p>
                <p className={clsx("truncate text-[11px]", product.available ? "text-muted" : "text-warning")}>
                  {product.description}
                </p>
                <p className="text-[12px] font-bold text-brand">{product.priceLabel}</p>
              </div>
            </li>
          ))}
          {preview.products.length === 0 && (
            <li className="col-span-full text-[12px] text-muted">Este momento todavía no tiene productos publicados.</li>
          )}
        </ul>
      </div>
      <nav
        aria-label="Navegación del cliente (vista previa)"
        className="flex h-[51.5px] w-full shrink-0 items-center border-t border-line bg-surface px-2.5"
      >
        {CUSTOMER_NAV.map(({ label: navLabel, icon: Icon }) => {
          const current = navLabel === "Carta";
          return (
            <span
              key={navLabel}
              aria-current={current ? "page" : undefined}
              className={clsx("flex flex-1 flex-col items-center gap-0.5", current ? "text-brand" : "text-muted")}
            >
              <Icon size={15} aria-hidden="true" />
              <span className="text-[11px] font-bold">{navLabel}</span>
            </span>
          );
        })}
      </nav>
    </section>
  );
}

/** "Complete Bottom Navigation" of the customer app (static in the preview, "Carta" current). */
const CUSTOMER_NAV: readonly { label: string; icon: LucideIcon }[] = [
  { label: "Inicio", icon: House },
  { label: "Carta", icon: Utensils },
  { label: "Pedido", icon: ShoppingBag },
  { label: "Cuenta", icon: UserRound },
];
