"use client";

import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import {
  Archive,
  CakeSlice,
  ChevronDown,
  ChevronUp,
  Coffee,
  Croissant,
  CupSoda,
  Eye,
  EyeOff,
  GlassWater,
  GripVertical,
  Hamburger,
  Pencil,
  Sandwich,
  Search,
  Tag,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { CategoryVisibilityFilter } from "@/features/categories/category-catalog";
import { Pagination, RowMenu, type RowMenuItem } from "@/shared/ui";
import type { CategoriesListView, CategoryListRow } from "./organization-state";
import { InlineVisibility, OrderStep } from "./OrganizationParts";

/**
 * "Category Icon": the export repeats invented categories' icons, so each catalogue category gets
 * its own icon; categories created in the session use a tag.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cafes: Coffee,
  bebidas: GlassWater,
  panaderia: Croissant,
  tostadas: Wheat,
  tostados: Sandwich,
  sandwiches: Sandwich,
  hamburguesas: Hamburger,
  postres: CakeSlice,
  licuados: CupSoda,
};

/** "Table Header" widths: ORDEN 90 / CATEGORÍA 310 / PRODUCTOS 120 / MOMENTOS 120 / VISIBILIDAD 150 / CONTENIDO 140 / ACCIONES. */
const COLUMNS = "grid grid-cols-[90px_310px_120px_120px_150px_140px_minmax(0,1fr)] items-center";

/** Numbers and actions are right-aligned, as in the export. */
const HEADERS = [
  ["ORDEN", "text-left"],
  ["CATEGORÍA", "text-left"],
  ["PRODUCTOS", "text-right"],
  ["MOMENTOS", "text-right"],
  ["VISIBILIDAD", "text-left"],
  ["CONTENIDO", "text-left"],
  ["ACCIONES", "text-right"],
] as const;

type CategoriesToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filter: CategoryVisibilityFilter;
  filters: CategoriesListView["filters"];
  onFilterChange: (filter: CategoryVisibilityFilter) => void;
};

/** "Search Categories" (300px) and "Visibility Filter" (120px, "Todas ▾") of the tabs row (9px → 12px). */
export function CategoriesToolbar({ query, onQueryChange, filter, filters, onFilterChange }: CategoriesToolbarProps) {
  return (
    <>
      <label className="flex h-full w-[300px] shrink-0 items-center gap-[7px] rounded-field bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:outline-brand">
        <Search size={13} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="sr-only">Buscar categoría</span>
        <input
          type="search"
          value={query}
          placeholder="Buscar categoría…"
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <label className="relative flex h-full w-[120px] shrink-0 items-center rounded-field bg-surface outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:outline-brand">
        <span className="sr-only">Visibilidad</span>
        <select
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as CategoryVisibilityFilter)}
          className="size-full cursor-pointer appearance-none bg-transparent pr-7 pl-2.5 text-[12px] font-bold text-ink outline-none"
        >
          {filters.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-2.5 text-muted" />
      </label>
    </>
  );
}

type CategoriesTableProps = {
  view: CategoriesListView;
  onEdit: (id: string) => void;
  /** `toIndex` is the position in the whole order (not in the page). */
  onReorder: (id: string, toIndex: number) => void;
  onMove: (id: string, step: number) => void;
  /** Starts the async save; the row shows "Actualizando…" until it settles. */
  onVisibilityChange: (id: string, visible: boolean) => void;
  /** Opens the editor on the archive review. */
  onArchive: (id: string) => void;
  onPageChange: (page: number) => void;
};

function stepFromKey(event: KeyboardEvent): number {
  if (event.key === "ArrowUp") return -1;
  if (event.key === "ArrowDown") return 1;
  return 0;
}

/**
 * "Optimized Categories Table": one 47.5px row per category of the current page in display
 * order. Rows are dragged by their grip, or moved with its arrow keys or the chevrons, only while
 * the whole order is listed (no search, filter "Todas"). The footer holds the result summary and
 * the pagination.
 */
export function CategoriesTable({
  view,
  onEdit,
  onReorder,
  onMove,
  onVisibilityChange,
  onArchive,
  onPageChange,
}: CategoriesTableProps) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [menuRowId, setMenuRowId] = useState<string | null>(null);
  const offset = view.page.from - 1;

  // No design for the menu: the row's secondary actions (invented copy).
  const menuItems = (row: CategoryListRow): RowMenuItem[] => {
    const pending = row.visibilityState === "pending";
    return [
      row.visible
        ? { label: "Ocultar en la carta", icon: EyeOff, disabled: pending, onSelect: () => onVisibilityChange(row.id, false) }
        : { label: "Mostrar en la carta", icon: Eye, disabled: pending, onSelect: () => onVisibilityChange(row.id, true) },
      { label: "Archivar", icon: Archive, onSelect: () => onArchive(row.id) },
    ];
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line">
      <div aria-hidden="true" className={clsx(COLUMNS, "h-9 shrink-0 border-b border-line bg-[#F7F6F2]")}>
        {HEADERS.map(([header, align]) => (
          <span key={header} className={clsx("px-3 text-[11px] font-bold tracking-[0.5px] text-muted", align)}>
            {header}
          </span>
        ))}
      </div>
      <ul aria-label="Categorías" className="min-h-0 flex-1 overflow-y-auto">
        {view.rows.map((row, index) => {
          const Icon = CATEGORY_ICONS[row.id] ?? Tag;
          const target = over === row.id && dragged !== row.id;
          return (
            <li
              key={row.id}
              onDragOver={(event) => {
                if (!dragged) return;
                event.preventDefault();
                setOver(row.id);
              }}
              onDragLeave={() => setOver((current) => (current === row.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged && dragged !== row.id) onReorder(dragged, offset + index);
                setDragged(null);
                setOver(null);
              }}
              className={clsx(
                COLUMNS,
                "group h-[47.5px] border-b border-[#EFEDE8] hover:bg-[#F2F5FF]",
                target && "bg-[#F2F5FF]",
                dragged === row.id && "opacity-60",
              )}
            >
              <span className="flex items-center gap-[5px] px-2.5">
                <button
                  type="button"
                  draggable={view.canReorder}
                  disabled={!view.canReorder}
                  aria-label={`Reordenar ${row.label}. Orden ${row.orderLabel}. Usá las flechas para moverla.`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", row.id);
                    setDragged(row.id);
                  }}
                  onDragEnd={() => {
                    setDragged(null);
                    setOver(null);
                  }}
                  onKeyDown={(event) => {
                    const step = stepFromKey(event);
                    if (!step) return;
                    event.preventDefault();
                    if ((step < 0 && row.canMoveUp) || (step > 0 && row.canMoveDown)) onMove(row.id, step);
                  }}
                  className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded-[5px] text-muted hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand active:cursor-grabbing disabled:cursor-not-allowed disabled:text-line"
                >
                  <GripVertical size={14} aria-hidden="true" />
                </button>
                <span
                  aria-hidden="true"
                  className="flex size-[25px] shrink-0 items-center justify-center rounded-[7px] bg-surface text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line group-hover:bg-brand group-hover:text-white group-hover:outline-brand"
                >
                  {row.orderLabel}
                </span>
                <span className="flex flex-col">
                  <OrderStep
                    label={`Subir ${row.label}`}
                    icon={ChevronUp}
                    compact
                    disabled={!row.canMoveUp}
                    onClick={() => onMove(row.id, -1)}
                  />
                  <OrderStep
                    label={`Bajar ${row.label}`}
                    icon={ChevronDown}
                    compact
                    disabled={!row.canMoveDown}
                    onClick={() => onMove(row.id, 1)}
                  />
                </span>
              </span>
              <span className="flex min-w-0 items-center gap-2.5 px-3">
                <span
                  className={clsx(
                    "flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-brand",
                    target ? "bg-brand-wash" : "bg-[#F4F2ED] group-hover:bg-brand-wash",
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-bold text-ink">{row.label}</span>
                  <span className="truncate text-[11px] text-muted">{row.description}</span>
                </span>
              </span>
              <span className={clsx("px-3 text-right text-[12px] font-bold", row.hasProducts ? "text-ink" : "text-warning")}>
                <span className="sr-only">Productos: </span>
                {row.productCount}
              </span>
              <span className="px-3 text-right text-[12px] font-bold text-ink">
                <span className="sr-only">Momentos: </span>
                {row.momentCount}
              </span>
              <span className="px-3">
                <InlineVisibility
                  visible={row.visible}
                  label={row.visibilityLabel}
                  pending={row.visibilityState === "pending"}
                  error={row.visibilityError}
                  ariaLabel={`Mostrar ${row.label} en la carta`}
                  labelSide="end"
                  onChange={(visible) => onVisibilityChange(row.id, visible)}
                />
              </span>
              <span className="px-3">
                <span
                  className={clsx(
                    "inline-flex h-[23px] items-center rounded-[7px] px-2 text-[11px] font-bold whitespace-nowrap",
                    row.hasProducts ? "bg-[#F3F2EE] text-ink" : "bg-warning-bg text-warning",
                  )}
                >
                  {row.contentLabel}
                </span>
              </span>
              <span className="flex items-center justify-end gap-1.5 px-[11px]">
                <button
                  type="button"
                  aria-label={`Editar ${row.label}`}
                  onClick={() => onEdit(row.id)}
                  className="flex h-[30px] items-center gap-[5px] rounded-nav bg-brand-wash px-2.5 text-brand hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Pencil size={11} aria-hidden="true" className="shrink-0" />
                  <span className="text-[11px] font-bold whitespace-nowrap">Editar</span>
                </button>
                <RowMenu
                  label={`Más acciones para ${row.label}`}
                  items={menuItems(row)}
                  open={menuRowId === row.id}
                  onOpenChange={(open) => setMenuRowId(open ? row.id : null)}
                />
              </span>
            </li>
          );
        })}
        {view.rows.length === 0 && (
          <li className="px-3.5 py-4 text-[12px] text-muted">No hay categorías con esa búsqueda o filtro.</li>
        )}
      </ul>
      <div className="flex h-[46px] shrink-0 items-center justify-between border-t border-line px-3.5">
        <p className="text-[11px] text-muted">{view.footer}</p>
        <Pagination page={view.page.page} pageCount={view.page.pageCount} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
