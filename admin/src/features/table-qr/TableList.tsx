"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  Download,
  EllipsisVertical,
  Pencil,
  Power,
  Printer,
  QrCode as QrCodeIcon,
  RefreshCw,
  Search,
} from "lucide-react";
import { RowMenu, type RowMenuItem } from "@/shared/ui";
import type { VenueSpace } from "@/mocks/service-day";
import type { SessionStatus } from "@/features/venue/table-config";
import type { ConfigurationFilter, QrStatus, SpaceFilter } from "./qr-config";
import { CONFIGURATION_FILTERS } from "./qr-config";
import type { ListRow } from "./table-qr-state";
import { StatusChip, type ChipTone } from "./TableQrParts";

type SelectFilterProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
};

/** "Filter · Espacio: Todos": 190×44 select; each option carries the filter name, 10px → 12px. */
function SelectFilter<T extends string>({ label, value, options, onChange }: SelectFilterProps<T>) {
  return (
    <div className="relative h-11 w-[190px] shrink-0">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="size-full cursor-pointer appearance-none rounded-[10px] bg-surface pr-9 pl-3 text-[12px] font-semibold text-ink outline-1 -outline-offset-[0.5px] outline-line focus:outline-2 focus:outline-brand"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {`${label}: ${option.label}`}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute top-[15px] right-3 text-ink" />
    </div>
  );
}

/** "Espacio" filter options: "Todos" plus every space. */
function getSpaceOptions(spaces: readonly VenueSpace[]): { id: SpaceFilter; label: string }[] {
  return [{ id: "all", label: "Todos" }, ...spaces.map((space) => ({ id: space.id, label: space.name }))];
}

type TableToolbarProps = {
  query: string;
  spaces: readonly VenueSpace[];
  space: SpaceFilter;
  configuration: ConfigurationFilter;
  onQueryChange: (query: string) => void;
  onSpaceChange: (space: SpaceFilter) => void;
  onConfigurationChange: (configuration: ConfigurationFilter) => void;
};

/** "Table Toolbar": search plus the "Espacio" and "Configuración" filters. */
export function TableToolbar(props: TableToolbarProps) {
  return (
    <div className="flex h-11 w-full shrink-0 gap-2">
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:outline-brand">
        <Search size={15} aria-hidden="true" className="shrink-0 text-muted" />
        <input
          type="search"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Buscar número de mesa…"
          aria-label="Buscar número de mesa"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <SelectFilter
        label="Espacio"
        value={props.space}
        options={getSpaceOptions(props.spaces)}
        onChange={props.onSpaceChange}
      />
      <SelectFilter
        label="Configuración"
        value={props.configuration}
        options={CONFIGURATION_FILTERS}
        onChange={props.onConfigurationChange}
      />
    </div>
  );
}

const SESSION_TONES: Record<SessionStatus, ChipTone> = {
  available: "success",
  occupied: "brand",
  "bill-requested": "warning",
};

const QR_TONES: Record<QrStatus, ChipTone> = { active: "brand", paused: "neutral", missing: "warning" };

export type RowActions = {
  /** "Editar mesa" opens the table in the Plano tab. */
  editHref: (id: string) => string;
  onToggleEnabled: (id: string) => void;
  onViewQr?: (id: string) => void;
  onDownload?: (id: string) => void;
  onOpenMaterial?: (id: string) => void;
  onRegenerate?: (id: string) => void;
};

type TableConfigurationListProps = { rows: readonly ListRow[]; filtered: boolean; actions: RowActions };

/**
 * "Table Configuration List": 36px sand header, then the rows sharing the remaining height
 * (44.8px each for twelve tables at 1440×900) and scrolling when there are more. Clicking a row
 * opens its QR detail; every row action lives in the vertical "more" menu.
 */
export function TableConfigurationList({ rows, filtered, actions }: TableConfigurationListProps) {
  const router = useRouter();
  const [menuId, setMenuId] = useState<string | null>(null);

  const menuItems = (row: ListRow): RowMenuItem[] => [
    ...(actions.onViewQr
      ? [{ label: "Ver código QR", icon: QrCodeIcon, onSelect: () => actions.onViewQr?.(row.id) }]
      : []),
    ...(actions.onDownload
      ? [
          {
            label: "Descargar QR",
            icon: Download,
            disabled: row.qr.status === "missing",
            hint: row.qr.status === "missing" ? "La mesa no tiene código QR." : undefined,
            onSelect: () => actions.onDownload?.(row.id),
          },
        ]
      : []),
    { label: "Editar mesa", icon: Pencil, onSelect: () => router.push(actions.editHref(row.id)) },
    ...(actions.onOpenMaterial
      ? [{ label: "Material imprimible", icon: Printer, onSelect: () => actions.onOpenMaterial?.(row.id) }]
      : []),
    {
      label: row.toggle.label,
      icon: Power,
      disabled: !row.toggle.allowed,
      hint: row.toggle.reason,
      onSelect: () => actions.onToggleEnabled(row.id),
    },
    ...(actions.onRegenerate
      ? [
          {
            label: "Regenerar código QR",
            icon: RefreshCw,
            tone: "danger" as const,
            onSelect: () => actions.onRegenerate?.(row.id),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line">
      <div role="table" aria-label="Mesas y códigos QR" className="flex min-h-0 flex-1 flex-col">
        <div role="rowgroup" className="shrink-0">
          <div role="row" className="flex h-9 items-center bg-sand px-3 text-[11px] font-bold text-muted">
            <span role="columnheader" className="w-[160px]">MESA</span>
            <span role="columnheader" className="w-[120px]">ESPACIO</span>
            <span role="columnheader" className="w-[120px]">CAPACIDAD</span>
            <span role="columnheader" className="w-[130px]">CONFIGURACIÓN</span>
            <span role="columnheader" className="w-[160px]">SESIÓN</span>
            <span role="columnheader" className="w-[120px]">QR</span>
            <span role="columnheader" className="flex-1 text-right">ACCIONES</span>
          </div>
        </div>
        <div role="rowgroup" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {rows.length === 0 && (
            <p className="px-3 py-6 text-[12px] text-muted">
              {filtered ? "No hay mesas que coincidan con la búsqueda." : "Todavía no hay mesas configuradas."}
            </p>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              role="row"
              // Mouse shortcut for the whole row; keyboard users reach the same action on the table name.
              onClick={actions.onViewQr ? () => actions.onViewQr?.(row.id) : undefined}
              className={clsx(
                "flex flex-[1_0_44px] items-center border-b border-line px-3 last:border-b-0",
                actions.onViewQr && "cursor-pointer hover:bg-cream",
              )}
            >
              <span role="cell" className="w-[160px] truncate pr-2 text-[13px] font-bold text-ink">
                {actions.onViewQr ? (
                  <button
                    type="button"
                    aria-label={`Ver código QR de ${row.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      actions.onViewQr?.(row.id);
                    }}
                    className="rounded-chip text-left hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {row.label}
                  </button>
                ) : (
                  row.label
                )}
              </span>
              <span role="cell" className="w-[120px] text-[12px] text-muted">{row.spaceName}</span>
              <span role="cell" className="w-[120px] text-[12px] text-muted">{row.capacityLabel}</span>
              <span role="cell" className="w-[130px]">
                <StatusChip
                  label={row.configuration.label}
                  tone={row.configuration.enabled ? "success" : "neutral"}
                  className="w-fit"
                />
              </span>
              {/* 09A columns are 90/120/90px for 9px chips; the 11px labels need 130/160/120px. */}
              <span role="cell" className="w-[160px]">
                <StatusChip label={row.session.label} tone={SESSION_TONES[row.session.status]} className="w-fit" />
              </span>
              <span role="cell" className="w-[120px]">
                <StatusChip label={row.qr.label} tone={QR_TONES[row.qr.status]} className="w-fit" />
              </span>
              {/* The menu renders inside this cell, so its clicks must not reach the row. */}
              <span role="cell" className="flex flex-1 items-center justify-end" onClick={(event) => event.stopPropagation()}>
                <RowMenu
                  label={`Más acciones de ${row.label}`}
                  items={menuItems(row)}
                  open={menuId === row.id}
                  onOpenChange={(open) => setMenuId(open ? row.id : null)}
                  triggerIcon={EllipsisVertical}
                  menuWidth={200}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
