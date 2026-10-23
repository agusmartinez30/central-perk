import clsx from "clsx";
import { Archive, ArchiveRestore, Copy, Pencil, type LucideIcon } from "lucide-react";
import type { ProductRowView } from "./products-state";
import { AvailabilitySwitch, ProductImage, PublicationStatus } from "./ProductTags";

type ProductCatalogTableProps = {
  rows: readonly ProductRowView[];
  /** "7 productos · Ordenados por nombre". */
  countLabel: string;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onAvailabilityChange: (id: string, available: boolean) => void;
};

/** Column widths of "Catalog Table Header"; "Acciones" takes the rest of the 1164px row. */
const COLUMNS = [
  { label: "Imagen", width: "w-[72px]" },
  { label: "Producto", width: "w-[190px]" },
  { label: "Categoría", width: "w-[130px]" },
  { label: "Precio base", width: "w-[110px]" },
  { label: "Publicación", width: "w-[130px]" },
  { label: "Disponibilidad", width: "w-[150px]" },
  { label: "Acciones", width: "" },
];

type RowActionProps = {
  label: string;
  /** Accessible name with the product, e.g. "Duplicar Cappuccino". */
  ariaLabel: string;
  icon: LucideIcon;
  primary?: boolean;
  onClick: () => void;
};

/** "Product Action · …": 32px button, brand-filled for "Editar". */
function RowAction({ label, ariaLabel, icon: Icon, primary = false, onClick }: RowActionProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={clsx(
        "flex h-8 items-center gap-[5px] rounded-[7px] px-[9px] outline-1 -outline-offset-[0.5px]",
        primary ? "bg-brand text-white outline-brand hover:bg-brand/92" : "bg-surface text-ink outline-line hover:bg-cream",
      )}
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      <span className="text-[11px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
}

const CELL = "px-2.5 align-middle";

/**
 * "Product Catalog Table": sticky header, one 65.5px "Producto · …" row per product (the body
 * scrolls when they do not fit) and the "Catalog Table Footer".
 */
export function ProductCatalogTable({
  rows,
  countLabel,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onAvailabilityChange,
}: ProductCatalogTableProps) {
  return (
    <section
      aria-label="Productos"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="sticky top-0 z-[1] bg-sand">
            <tr className="h-10">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={clsx(CELL, column.width, "text-[11px] font-bold whitespace-nowrap text-muted")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const archived = row.status === "archived";
              return (
                <tr key={row.id} className="h-[65.5px] border-b border-line">
                  <td className={CELL}>
                    <ProductImage src={row.image} alt={row.name} sizes="44px" className="size-11 rounded-nav" />
                  </td>
                  <th scope="row" className={clsx(CELL, "truncate text-[13px] font-bold text-ink")}>
                    {row.name}
                  </th>
                  <td className={clsx(CELL, "truncate text-[12px] font-semibold text-muted")}>{row.categoryLabel}</td>
                  <td className={clsx(CELL, "text-[13px] font-bold whitespace-nowrap text-ink")}>{row.price}</td>
                  <td className={CELL}>
                    <PublicationStatus status={row.status} label={row.statusLabel} />
                  </td>
                  <td className={CELL}>
                    <AvailabilitySwitch
                      available={row.available}
                      label={`Disponibilidad de ${row.name}`}
                      disabled={archived}
                      onChange={(available) => onAvailabilityChange(row.id, available)}
                    />
                  </td>
                  <td className={CELL}>
                    <div className="flex items-center gap-1.5">
                      <RowAction label="Editar" ariaLabel={`Editar ${row.name}`} icon={Pencil} primary onClick={() => onEdit(row.id)} />
                      <RowAction label="Duplicar" ariaLabel={`Duplicar ${row.name}`} icon={Copy} onClick={() => onDuplicate(row.id)} />
                      {archived ? (
                        <RowAction
                          label="Restaurar"
                          ariaLabel={`Restaurar ${row.name}`}
                          icon={ArchiveRestore}
                          onClick={() => onRestore(row.id)}
                        />
                      ) : (
                        <RowAction label="Archivar" ariaLabel={`Archivar ${row.name}`} icon={Archive} onClick={() => onArchive(row.id)} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-line px-3">
        <p role="status" className="text-[11px] font-semibold whitespace-nowrap text-muted">
          {countLabel}
        </p>
        <p className="flex items-center gap-1.5 text-muted">
          <Archive size={12} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap">
            Productos con pedidos confirmados se archivan, no se eliminan.
          </span>
        </p>
      </footer>
    </section>
  );
}
