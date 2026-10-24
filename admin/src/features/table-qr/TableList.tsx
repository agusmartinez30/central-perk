"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Ellipsis, Pencil, QrCode as QrCodeIcon, Search } from "lucide-react";
import type { VenueSpace } from "@/mocks/service-day";
import type { ConfigurationFilter, QrStatus, SpaceFilter, SessionStatus } from "./table-config";
import { CONFIGURATION_FILTERS } from "./table-config";
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
  onEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onViewQr?: (id: string) => void;
  onDownload?: (id: string) => void;
  onOpenMaterial?: (id: string) => void;
  onRegenerate?: (id: string) => void;
};

type IconActionProps = {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  expanded?: boolean;
  /** "Action · Ver QR" is brand blue in 09A. */
  brand?: boolean;
};

/** 15px row icons; the 26px hit area keeps the export's 11px gap between them. */
function IconAction({ label, icon: Icon, onClick, expanded, brand = false }: IconActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-expanded={expanded}
      onClick={onClick}
      className={clsx(
        "flex size-[26px] items-center justify-center rounded-chip hover:bg-cream",
        brand ? "text-brand" : "text-ink",
      )}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

type MenuItem = { label: string; onSelect: () => void; disabled?: boolean; hint?: string; tone?: "danger" };

/** "Action · Más" menu (invented: the exports only show the ellipsis). */
function RowMenu({ items, onClose, up }: { items: MenuItem[]; onClose: () => void; up: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.parentElement?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const buttons = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = buttons[(index + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length];
          next?.focus();
        }
      }}
      className={clsx(
        "absolute right-0 z-20 flex w-[230px] flex-col rounded-card bg-surface p-1.5 shadow-modal outline-1 -outline-offset-[0.5px] outline-line",
        up ? "bottom-8" : "top-8",
      )}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className={clsx(
            "flex flex-col items-start gap-0.5 rounded-[7px] px-2.5 py-2 text-left enabled:hover:bg-cream disabled:cursor-not-allowed",
            item.tone === "danger" ? "text-danger" : "text-ink",
          )}
        >
          <span className={clsx("text-[12px] font-semibold", item.disabled && "text-muted")}>{item.label}</span>
          {item.hint && <span className="text-[11px] text-muted">{item.hint}</span>}
        </button>
      ))}
    </div>
  );
}

type TableConfigurationListProps = { rows: readonly ListRow[]; filtered: boolean; actions: RowActions };

/**
 * "Table Configuration List": 36px sand header, then the rows sharing the remaining height
 * (44.8px each for twelve tables at 1440×900) and scrolling when there are more.
 */
export function TableConfigurationList({ rows, filtered, actions }: TableConfigurationListProps) {
  const [menuId, setMenuId] = useState<string | null>(null);

  const menuItems = (row: ListRow): MenuItem[] => [
    ...(actions.onOpenMaterial
      ? [{ label: "Material imprimible", onSelect: () => actions.onOpenMaterial?.(row.id) }]
      : []),
    {
      label: row.toggle.label,
      disabled: !row.toggle.allowed,
      hint: row.toggle.reason,
      onSelect: () => actions.onToggleEnabled(row.id),
    },
    ...(actions.onRegenerate
      ? [{ label: "Regenerar código QR", tone: "danger" as const, onSelect: () => actions.onRegenerate?.(row.id) }]
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
            <span role="columnheader" className="flex-1">ACCIONES</span>
          </div>
        </div>
        <div role="rowgroup" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {rows.length === 0 && (
            <p className="px-3 py-6 text-[12px] text-muted">
              {filtered ? "No hay mesas que coincidan con la búsqueda." : "Todavía no hay mesas configuradas."}
            </p>
          )}
          {rows.map((row, index) => (
            <div
              key={row.id}
              role="row"
              className="flex flex-[1_0_44px] items-center border-b border-line px-3 last:border-b-0"
            >
              <span role="cell" className="w-[160px] truncate pr-2 text-[13px] font-bold text-ink">
                {row.label}
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
              <span role="cell" className="relative flex flex-1 items-center justify-end">
                <IconAction label={`Editar ${row.label}`} icon={Pencil} onClick={() => actions.onEdit(row.id)} />
                {actions.onViewQr && (
                  <IconAction
                    label={`Ver QR de ${row.label}`}
                    icon={QrCodeIcon}
                    brand
                    onClick={() => actions.onViewQr?.(row.id)}
                  />
                )}
                {actions.onDownload && row.qr.status !== "missing" && (
                  <IconAction
                    label={`Descargar QR de ${row.label}`}
                    icon={Download}
                    onClick={() => actions.onDownload?.(row.id)}
                  />
                )}
                <IconAction
                  label={`Más acciones de ${row.label}`}
                  icon={Ellipsis}
                  expanded={menuId === row.id}
                  onClick={() => setMenuId((current) => (current === row.id ? null : row.id))}
                />
                {menuId === row.id && (
                  // The last rows open the menu upwards so it stays inside the list.
                  <RowMenu items={menuItems(row)} onClose={() => setMenuId(null)} up={index >= 3 && index >= rows.length - 3} />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
