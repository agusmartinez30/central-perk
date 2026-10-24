"use client";

import clsx from "clsx";
import { useEffect, useId, useRef } from "react";
import { ChevronDown, Square, SquareCheck, X } from "lucide-react";
import type { VenueSpace } from "@/mocks/service-day";
import type { PrintSizeId } from "./print-selection";
import { QrCode } from "./QrCode";
import type { SpaceFilter } from "./table-config";
import type { BulkView, TableQrAction } from "./table-qr-state";

type BulkPrintModalProps = {
  view: BulkView;
  onAction: (action: TableQrAction) => void;
  onExport: () => void;
};

/** "Espacio" filter options: "Todos" plus every space. */
function getSpaceOptions(spaces: readonly VenueSpace[]): { id: SpaceFilter; label: string }[] {
  return [{ id: "all", label: "Todos" }, ...spaces.map((space) => ({ id: space.id, label: space.name }))];
}

const FOCUSABLE = "button:not([disabled]), select, [tabindex]:not([tabindex='-1'])";

/** "Bulk Filter · Espacio / Tamaño": cream select whose options carry the filter name, 9px → 11px. */
function BulkSelect<T extends string>(props: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="relative h-[38px] min-w-0 flex-1">
      <select
        aria-label={props.label}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value as T)}
        className="size-full cursor-pointer appearance-none rounded-nav bg-cream pr-8 pl-2.5 text-[11px] font-semibold text-ink outline-none focus:outline-2 focus:outline-brand"
      >
        {props.options.map((option) => (
          <option key={option.id} value={option.id}>
            {`${props.label}: ${option.label}`}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute top-3 right-2.5 text-muted" />
    </div>
  );
}

/**
 * 09E "Bulk QR Printing Modal" over the dimmed 09A list ("Modal Scrim"): selection count,
 * "✓ Seleccionar todos", spaceId and size, the table checklist, the A4 preview of the first sheet
 * and "Exportar PDF" (the browser's print dialog with every sheet). Escape, the close button or
 * the scrim close it; focus stays inside and returns to "Imprimir códigos QR".
 */
export function BulkPrintModal({ view, onAction, onExport }: BulkPrintModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => onAction({ type: "close-bulk" });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => opener?.focus();
  }, []);

  return (
    // The 09E modal sits 118px below the top bar, centered over the 1220px main area.
    <div
      className="fixed top-[72px] right-0 bottom-0 left-[220px] z-40 flex items-start justify-center bg-ink/33 pt-[118px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            close();
          } else if (event.key === "Tab") {
            const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
        className="flex h-[500px] w-[760px] flex-col gap-3 rounded-auth bg-surface p-5 shadow-[0_8px_28px_#10101022] outline-1 -outline-offset-[0.5px] outline-line"
      >
        <div className="flex w-full items-center justify-between gap-3">
          <h2 id={titleId} className="text-[18px] font-bold text-ink">
            Imprimir códigos QR
          </h2>
          <div className="flex items-center gap-2">
            <p role="status" className="text-[12px] font-bold text-brand">
              {view.countLabel}
            </p>
            {/* Invented: the export has no close control. */}
            <button
              type="button"
              aria-label="Cerrar"
              onClick={close}
              className="flex size-7 items-center justify-center rounded-nav text-ink hover:bg-cream"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex h-[38px] w-full shrink-0 gap-2">
          <button
            type="button"
            aria-pressed={view.allSelected}
            onClick={() => onAction({ type: "bulk-toggle-all" })}
            className="flex h-[38px] min-w-0 flex-1 items-center rounded-nav bg-cream px-2.5 text-left text-[11px] font-semibold text-ink hover:bg-sand"
          >
            {view.allSelected ? "✓ Seleccionar todos" : "Seleccionar todos"}
          </button>
          <BulkSelect
            label="Espacio"
            value={view.space}
            options={getSpaceOptions(view.spaces)}
            onChange={(space) => onAction({ type: "bulk-set-space", space })}
          />
          <BulkSelect<PrintSizeId>
            label="Tamaño"
            value={view.size}
            options={view.sizes}
            onChange={(size) => onAction({ type: "bulk-set-size", size })}
          />
        </div>

        <div className="flex min-h-0 w-full flex-1 gap-3.5">
          <ul aria-label="Mesas a imprimir" className="flex min-h-0 min-w-0 flex-1 flex-col gap-[5px] overflow-y-auto">
            {view.rows.map((row) => (
              <li key={row.id} className="flex flex-[1_0_26px]">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.selected}
                  onClick={() => onAction({ type: "bulk-toggle", id: row.id })}
                  className="flex w-full items-center gap-2 rounded-[7px] bg-cream px-[9px] text-left hover:bg-sand"
                >
                  {row.selected ? (
                    <SquareCheck size={14} aria-hidden="true" className="shrink-0 text-brand" />
                  ) : (
                    <Square size={14} aria-hidden="true" className="shrink-0 text-muted" />
                  )}
                  <span className="text-[11px] text-ink">{row.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex h-full w-[310px] shrink-0 flex-col gap-[7px] rounded-[9px] bg-cream p-3">
            <p className="flex justify-between text-[11px] font-bold text-muted">
              <span>VISTA PREVIA · A4</span>
              {view.sheets.length > 1 && <span className="font-semibold">{`${view.sheets.length} hojas`}</span>}
            </p>
            {view.preview.length === 0 && (
              <p className="py-6 text-center text-[12px] text-muted">Seleccioná al menos una mesa.</p>
            )}
            {view.preview.map((card) => (
              <div
                key={card.tableId}
                className="flex w-full min-h-0 flex-1 items-center justify-between overflow-hidden bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line"
              >
                <span className="text-[11px] font-bold text-ink">{card.title}</span>
                <QrCode
                  value={card.url}
                  size={view.perSheet > 4 ? 30 : 34}
                  label={`Código QR de ${card.label}`}
                  className="text-ink"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center justify-between">
          <p className="text-[11px] text-muted">Solo se incluyen credenciales QR activas.</p>
          <button
            type="button"
            disabled={!view.canExport}
            onClick={onExport}
            className={clsx(
              "flex h-[38px] items-center rounded-[9px] bg-brand px-[13px] text-[12px] font-bold text-white",
              view.canExport ? "hover:bg-brand/92" : "cursor-not-allowed opacity-50",
            )}
          >
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
