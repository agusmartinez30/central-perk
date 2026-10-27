"use client";

import clsx from "clsx";
import { Archive, ArchiveRestore, Copy, Pencil, SearchX } from "lucide-react";
import { useState } from "react";
import { Pagination, RowMenu, type RowMenuItem } from "@/shared/ui";
import type { ProductRowView } from "./products-state";
import { ProductImage } from "./ProductTags";

type ProductCatalogTableProps = {
  rows: readonly ProductRowView[];
  /** "13 productos". */
  countLabel: string;
  /** "Mostrando todos · Orden: relevancia comercial". */
  summaryLabel: string;
  page: number;
  pageCount: number;
  /** No product matches the search and filters. */
  empty: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onAvailabilityChange: (id: string, available: boolean) => void;
};

/** "Table Header" columns of the 1164px table, widths from the 07A export. */
const COLUMNS = [
  { label: "Producto", width: "w-[400px]", align: "text-left" },
  { label: "Precio", width: "w-[110px]", align: "text-right" },
  { label: "Momentos", width: "w-[150px]", align: "text-left" },
  { label: "Publicación", width: "w-[140px]", align: "text-left" },
  { label: "Disponibilidad", width: "w-[170px]", align: "text-left" },
  { label: "Acciones", width: "", align: "text-right" },
] as const;

const CELL = "px-3 align-middle";

const PUBLICATION_TONES: Record<ProductRowView["status"], string> = {
  published: "bg-success-bg text-success",
  draft: "bg-sand text-muted",
  archived: "bg-warning-bg text-warning",
};

/** "Availability": 30×18 switch with its state line and, after a failed save, the inline error. */
function RowAvailability({ row, onChange }: { row: ProductRowView; onChange: (available: boolean) => void }) {
  const pending = row.availabilityState === "pending";
  const archived = row.status === "archived";
  return (
    <div className="flex flex-col items-start gap-[3px]">
      <span className="inline-flex items-center gap-[7px]">
        <button
          type="button"
          role="switch"
          aria-checked={row.available}
          aria-label={`Disponibilidad de ${row.name}`}
          aria-busy={pending || undefined}
          disabled={archived || pending}
          onClick={() => onChange(!row.available)}
          className={clsx(
            "flex h-[18px] w-[30px] shrink-0 items-center rounded-[9px] p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            row.available ? "justify-end bg-brand" : "justify-start bg-[#D3CFC6]",
            archived && "cursor-not-allowed opacity-50",
            pending && "cursor-progress",
          )}
        >
          <span aria-hidden="true" className="size-3.5 rounded-full bg-surface" />
        </button>
        <span
          aria-hidden="true"
          className={clsx(
            "text-[11px] font-semibold whitespace-nowrap",
            pending ? "text-brand" : row.availabilityError ? "text-warning" : "text-ink",
          )}
        >
          {row.availabilityLabel}
        </span>
      </span>
      {row.availabilityError && (
        <span className="text-[11px] font-bold whitespace-nowrap text-danger">{row.availabilityError}</span>
      )}
    </div>
  );
}

function EmptyRows({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <SearchX size={28} aria-hidden="true" className="text-muted" />
      <p className="text-[14px] font-bold text-ink">Sin productos para estos filtros</p>
      <p className="max-w-[360px] text-[12px] text-muted">Probá con otra búsqueda o limpiá los filtros.</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-1 flex h-[34px] items-center rounded-nav px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream focus-visible:outline-2 focus-visible:outline-brand"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

/**
 * "Products Table · Commerce": sticky header, one 65.5px row per product of the current page,
 * "Editar" plus a "More Actions" menu per row, and the "Commerce Footer" with the pagination.
 */
export function ProductCatalogTable({
  rows,
  countLabel,
  summaryLabel,
  page,
  pageCount,
  empty,
  onPageChange,
  onClearFilters,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onAvailabilityChange,
}: ProductCatalogTableProps) {
  const [menuRowId, setMenuRowId] = useState<string | null>(null);

  const menuItems = (row: ProductRowView): RowMenuItem[] => [
    { label: "Duplicar", icon: Copy, onSelect: () => onDuplicate(row.id) },
    row.status === "archived"
      ? { label: "Restaurar", icon: ArchiveRestore, onSelect: () => onRestore(row.id) }
      : { label: "Archivar", icon: Archive, onSelect: () => onArchive(row.id) },
  ];

  return (
    <section
      aria-label="Productos"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[10px] bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="min-h-0 shrink overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-[#F6F4EF]">
            <tr className="h-[38px]">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={clsx(
                    CELL,
                    column.width,
                    column.align,
                    "text-[11px] font-bold tracking-[0.7px] whitespace-nowrap text-muted uppercase",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          {!empty && (
            <tbody>
              {rows.map((row) => {
                const menuOpen = menuRowId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={clsx(
                      "h-[65.5px] border-b border-[#E8E5DF]",
                      menuOpen ? "bg-[#F1F4FF] shadow-[inset_3px_0_0_#2F45AD]" : "bg-surface",
                      row.status === "archived" && "opacity-[0.92]",
                    )}
                  >
                    <th scope="row" className={clsx(CELL, "text-left font-normal")}>
                      <span className="flex items-center gap-3">
                        <ProductImage src={row.image} alt={row.name} sizes="56px" className="size-14 rounded-[10px]" />
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-[13px] font-bold text-ink">{row.name}</span>
                          <span className="truncate text-[11px] text-muted">{row.metaLabel}</span>
                        </span>
                      </span>
                    </th>
                    <td className={clsx(CELL, "text-right text-[13px] font-bold whitespace-nowrap text-ink")}>{row.price}</td>
                    <td title={row.momentsLabel} className={clsx(CELL, "truncate text-[12px] font-medium text-muted")}>
                      {row.momentsLabel}
                    </td>
                    <td className={CELL}>
                      <span
                        className={clsx(
                          "inline-flex h-[23px] items-center rounded-[12px] px-2 text-[11px] font-bold whitespace-nowrap",
                          PUBLICATION_TONES[row.status],
                        )}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className={CELL}>
                      <RowAvailability row={row} onChange={(available) => onAvailabilityChange(row.id, available)} />
                    </td>
                    <td className="px-2.5 align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Editar ${row.name}`}
                          onClick={() => onEdit(row.id)}
                          className="flex h-[30px] items-center gap-[5px] rounded-nav bg-brand-wash px-2.5 text-brand hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          <Pencil size={12} aria-hidden="true" className="shrink-0" />
                          <span className="text-[11px] font-bold whitespace-nowrap">Editar</span>
                        </button>
                        <RowMenu
                          label={`Más acciones para ${row.name}`}
                          items={menuItems(row)}
                          open={menuOpen}
                          onOpenChange={(open) => setMenuRowId(open ? row.id : null)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
      {empty && <EmptyRows onClearFilters={onClearFilters} />}
      <footer
        className={clsx(
          "flex min-h-12 w-full items-center justify-between border-t border-[#E8E5DF] px-3.5",
          empty ? "shrink-0" : "flex-1",
        )}
      >
        <p role="status" className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[12px] font-bold text-ink">{countLabel}</span>
          <span className="text-[11px] text-muted">{summaryLabel}</span>
        </p>
        <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
      </footer>
    </section>
  );
}
