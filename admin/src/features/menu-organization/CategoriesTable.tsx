"use client";

import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import {
  CakeSlice,
  Coffee,
  Croissant,
  CupSoda,
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
import type { CategoryRow, CategoryStatus } from "@/features/categories/category-catalog";

/**
 * "Category Icon": the export repeats the coffee cup on every row (leftover), so each catalogue
 * category gets its own icon; categories created in the session use a tag.
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

const STATUS_TONES: Record<CategoryStatus, string> = {
  visible: "bg-success-bg text-success",
  empty: "bg-warning-bg text-warning",
  hidden: "bg-sand text-muted",
};

/** Column widths of the "Table Header" (206 / 140 / 130 / 80 / 50 px, actions fill). */
const COLUMNS = "grid grid-cols-[206px_140px_130px_80px_50px_1fr] items-center";

type CategoriesToolbarProps = { query: string; onQueryChange: (query: string) => void };

/** "Search Categories": 300×38 search box of the tabs row (9px → 12px). */
export function CategoriesToolbar({ query, onQueryChange }: CategoriesToolbarProps) {
  return (
    <label className="flex h-[38px] w-[300px] shrink-0 items-center gap-[7px] rounded-field bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:outline-brand">
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
  );
}

type CategoriesTableProps = {
  rows: CategoryRow[];
  /** Search active: dragging is disabled because the visible rows are not the whole order. */
  filtered: boolean;
  onEdit: (id: string) => void;
  onReorder: (id: string, toIndex: number) => void;
  onMove: (id: string, step: number) => void;
};

function stepFromKey(event: KeyboardEvent): number {
  if (event.key === "ArrowUp") return -1;
  if (event.key === "ArrowDown") return 1;
  return 0;
}

/**
 * "Categories Table": one row per active category in display order, with derived product and
 * moment counts, the status chip and the order. Rows are dragged by their grip (or moved with
 * the arrow keys) and edited with the pencil.
 */
export function CategoriesTable({ rows, filtered, onEdit, onReorder, onMove }: CategoriesTableProps) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line">
      <div
        aria-hidden="true"
        className={clsx(COLUMNS, "h-9 shrink-0 bg-sand px-3.5 text-[11px] font-bold text-muted")}
      >
        <span>CATEGORÍA</span>
        <span>PRODUCTOS</span>
        <span>MOMENTOS</span>
        <span>ESTADO</span>
        <span className="text-center">
          ORDEN
        </span>
        <span className="pl-3">
          ACCIONES
        </span>
      </div>
      <ul aria-label="Categorías" className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((row, index) => {
          const Icon = CATEGORY_ICONS[row.id] ?? Tag;
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
                if (dragged && dragged !== row.id) onReorder(dragged, index);
                setDragged(null);
                setOver(null);
              }}
              className={clsx(
                COLUMNS,
                "h-[41px] border-b border-line px-3.5",
                over === row.id && dragged !== row.id && "bg-brand-wash",
                dragged === row.id && "opacity-60",
              )}
            >
              <span className="flex min-w-0 items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-nav bg-brand-wash text-brand">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="truncate text-[13px] font-bold text-ink">{row.label}</span>
              </span>
              <span className="text-[12px] text-muted">{row.productLabel}</span>
              <span className="text-[12px] text-muted">{row.momentLabel}</span>
              <span
                className={clsx(
                  "flex h-6 w-20 items-center justify-center rounded-xl text-[11px] font-bold",
                  STATUS_TONES[row.status],
                )}
              >
                {row.statusLabel}
              </span>
              <span className="text-center text-[12px] font-bold text-ink">{row.orderLabel}</span>
              <span className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  draggable={!filtered}
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
                    onMove(row.id, step);
                  }}
                  className="flex size-6 cursor-grab items-center justify-center rounded-nav text-muted hover:bg-cream active:cursor-grabbing"
                >
                  <GripVertical size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Editar ${row.label}`}
                  onClick={() => onEdit(row.id)}
                  className="flex size-6 items-center justify-center rounded-nav text-brand hover:bg-brand-wash"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </span>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-3.5 py-4 text-[12px] text-muted">No hay categorías con ese nombre.</li>}
      </ul>
    </div>
  );
}
