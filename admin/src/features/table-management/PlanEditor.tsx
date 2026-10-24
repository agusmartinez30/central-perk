"use client";

import clsx from "clsx";
import { useRef } from "react";
import { Map as MapIcon, Plus, X } from "lucide-react";
import { TableFigure, ZoomControls } from "@/features/tables/FloorPlan";
import { getFitTransform, zoomAround, type PlanTransform } from "@/features/tables/floor-plan";
import { PLAN_SIZE, TABLE_BOX } from "@/features/venue/table-layout";
import type { EditorTable, Notice, PlanView } from "./management-state";

/** The plan opens at 1:1 with the editable area 16px from the corner. */
export const DEFAULT_EDITOR_TRANSFORM: PlanTransform = { scale: 1, x: 16, y: 16 };

/** Corners of the editable area, so "Ajustar a la vista" shows the whole plan. */
const PLAN_CORNERS = [
  { x: 0, y: 0 },
  { x: PLAN_SIZE.width - TABLE_BOX.width, y: PLAN_SIZE.height - TABLE_BOX.height },
];

type EditorTableProps = { table: EditorTable; onSelect: (id: string) => void };

/** A table in edit mode: the 02 figure in neutral colors with its label and capacity; disabled ones dimmed. */
function EditorTableButton({ table, onSelect }: EditorTableProps) {
  return (
    <button
      type="button"
      aria-pressed={table.selected}
      aria-label={`${table.label}: ${table.capacityLabel}${table.enabled ? "" : ", deshabilitada"}`}
      onClick={() => onSelect(table.id)}
      style={{ left: table.x, top: table.y, width: TABLE_BOX.width, height: TABLE_BOX.height }}
      className={clsx(
        "group absolute rounded-[14px] focus-visible:outline-2 focus-visible:outline-brand",
        !table.enabled && !table.selected && "opacity-45",
      )}
    >
      <TableFigure
        chairs={table.chairs}
        shape={table.shape}
        chairClass="bg-[#e9e6e1]"
        bodyClass={table.enabled ? "bg-surface" : "bg-sand"}
        ringClass={table.selected ? "outline-brand" : null}
      >
        <span className="max-w-[104px] truncate text-[13px] font-bold whitespace-nowrap text-ink">{table.label}</span>
        <span className="text-[10px] whitespace-nowrap text-muted">{table.capacityLabel}</span>
        {!table.enabled && <span className="text-[10px] font-bold whitespace-nowrap text-muted">Deshabilitada</span>}
      </TableFigure>
    </button>
  );
}

type PlanEditorProps = {
  view: PlanView;
  transform: PlanTransform;
  notice: Notice | null;
  onTransformChange: (transform: PlanTransform) => void;
  onSelect: (id: string) => void;
  onDismissNotice: () => void;
  onNewTable: () => void;
};

/**
 * The active space's plan in edit mode (no export; built from the 02 plan): the editable area
 * drawn as a dotted grid, every table of the space (disabled ones too) and the 02 zoom controls.
 */
export function PlanEditor({ view, transform, notice, onTransformChange, onSelect, onDismissNotice, onNewTable }: PlanEditorProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const viewport = () => {
    const element = viewportRef.current;
    return { width: element?.clientWidth ?? 812, height: element?.clientHeight ?? 652 };
  };
  const zoom = (direction: 1 | -1) => {
    const { width, height } = viewport();
    onTransformChange(zoomAround(transform, direction, { x: width / 2, y: height / 2 }));
  };
  const { scale, x, y } = transform;

  return (
    <section
      ref={viewportRef}
      aria-label={`Plano editable · ${view.spaceName}`}
      className="relative min-h-[480px] w-full flex-1 overflow-hidden rounded-card bg-[#f7f5f1] outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-200"
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 rounded-[10px] outline-1 outline-dashed outline-line"
          style={{
            width: PLAN_SIZE.width,
            height: PLAN_SIZE.height,
            backgroundImage: "radial-gradient(circle, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        {view.tables.map((table) => (
          <EditorTableButton key={table.id} table={table} onSelect={onSelect} />
        ))}
      </div>

      <p className="absolute top-4 left-[18px] flex items-center gap-[7px] rounded-nav bg-surface px-2.5 py-[7px] outline-1 -outline-offset-[0.5px] outline-line">
        <MapIcon size={14} aria-hidden="true" className="text-ink" />
        <span className="text-[12px] font-bold whitespace-nowrap text-ink">{view.spaceName}</span>
        <span className="text-[11px] whitespace-nowrap text-muted">· {view.countLabel}</span>
      </p>

      {notice && (
        <p
          className={clsx(
            "absolute top-4 left-1/2 flex max-w-[70%] -translate-x-1/2 items-center gap-2 rounded-nav py-[7px] pr-1.5 pl-3 outline-1 -outline-offset-[0.5px]",
            notice.tone === "error" ? "bg-danger-bg text-danger outline-danger/30" : "bg-success-bg text-success outline-success/30",
          )}
        >
          <span className="truncate text-[12px] font-bold">{notice.text}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={onDismissNotice}
            className="flex size-5 shrink-0 items-center justify-center rounded-chip hover:bg-surface/60"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </p>
      )}

      {view.tables.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-[15px] font-bold text-ink">{`Todavía no hay mesas en ${view.spaceName}`}</p>
          <button
            type="button"
            onClick={onNewTable}
            className="flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline"
          >
            <Plus size={14} aria-hidden="true" />
            Agregar la primera mesa
          </button>
        </div>
      )}

      <ZoomControls onZoom={zoom} onFit={() => onTransformChange(getFitTransform(PLAN_CORNERS, viewport()))} />
    </section>
  );
}
