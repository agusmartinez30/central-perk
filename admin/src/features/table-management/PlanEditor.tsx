"use client";

import clsx from "clsx";
import { useRef, useState, type PointerEvent } from "react";
import { Map as MapIcon, Plus, X } from "lucide-react";
import { TableFigure, ZoomControls } from "@/features/tables/FloorPlan";
import { getFitTransform, zoomAround, type PlanTransform } from "@/features/tables/floor-plan";
import { PLAN_SIZE, TABLE_BOX, type PlanPoint } from "@/features/venue/table-layout";
import type { EditorTable, Notice, PlanView } from "./management-state";
import { getArrowMove, getDragPoint, hasDragged } from "./plan-drag";

/** The plan opens at 1:1 with the editable area 16px from the corner. */
export const DEFAULT_EDITOR_TRANSFORM: PlanTransform = { scale: 1, x: 16, y: 16 };

/** Corners of the editable area, so "Ajustar a la vista" shows the whole plan. */
const PLAN_CORNERS = [
  { x: 0, y: 0 },
  { x: PLAN_SIZE.width - TABLE_BOX.width, y: PLAN_SIZE.height - TABLE_BOX.height },
];

/** A press on a table: where it started and, once it travelled past the threshold, where it is drawn. */
type Drag = { id: string; pointerId: number; start: PlanPoint; origin: PlanPoint; point: PlanPoint; moved: boolean };

type EditorTableProps = {
  table: EditorTable;
  /** Position while being dragged; null at rest. */
  dragPoint: PlanPoint | null;
  /** False while dragged over another table: the drop will be refused. */
  droppable: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, point: PlanPoint) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, table: EditorTable) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerEnd: (event: PointerEvent<HTMLButtonElement>, drop: boolean) => void;
  /** True right after a drag, so the click that ends it does not reselect. */
  consumeClick: () => boolean;
};

/**
 * A table in edit mode: the 02 figure in neutral colors with its label and capacity; disabled
 * ones dimmed. Drag it with the pointer, or focus it and use the arrow keys (Shift: 40px).
 */
function EditorTableButton(props: EditorTableProps) {
  const { table, dragPoint, droppable } = props;
  const point = dragPoint ?? table;
  return (
    <button
      type="button"
      aria-pressed={table.selected}
      aria-label={`${table.label}: ${table.capacityLabel}${table.enabled ? "" : ", deshabilitada"}`}
      aria-describedby="plan-editor-help"
      onClick={() => {
        if (!props.consumeClick()) props.onSelect(table.id);
      }}
      onKeyDown={(event) => {
        const next = getArrowMove(table, event.key, event.shiftKey);
        if (!next) return;
        event.preventDefault();
        props.onMove(table.id, next);
      }}
      onPointerDown={(event) => props.onPointerDown(event, table)}
      onPointerMove={props.onPointerMove}
      onPointerUp={(event) => props.onPointerEnd(event, true)}
      onPointerCancel={(event) => props.onPointerEnd(event, false)}
      style={{ left: point.x, top: point.y, width: TABLE_BOX.width, height: TABLE_BOX.height }}
      className={clsx(
        "group absolute touch-none rounded-[14px] focus-visible:outline-2 focus-visible:outline-brand",
        dragPoint ? "z-10 cursor-grabbing drop-shadow-[0_8px_16px_#10101026]" : "cursor-grab",
        !table.enabled && !table.selected && !dragPoint && "opacity-45",
      )}
    >
      <TableFigure
        chairs={table.chairs}
        shape={table.shape}
        chairClass={dragPoint && !droppable ? "bg-danger-bg" : "bg-[#e9e6e1]"}
        bodyClass={dragPoint && !droppable ? "bg-danger-bg" : table.enabled ? "bg-surface" : "bg-sand"}
        ringClass={dragPoint && !droppable ? "outline-danger" : table.selected || dragPoint ? "outline-brand" : null}
      >
        <span className="max-w-[104px] truncate text-[13px] font-bold whitespace-nowrap text-ink">{table.label}</span>
        <span className="text-[10px] whitespace-nowrap text-muted">{table.capacityLabel}</span>
        {dragPoint && !droppable ? (
          <span className="text-[10px] font-bold whitespace-nowrap text-danger">No entra acá</span>
        ) : (
          !table.enabled && <span className="text-[10px] font-bold whitespace-nowrap text-muted">Deshabilitada</span>
        )}
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
  /** Drop or arrow-key move; the screen refuses overlaps with a notice (the table snaps back). */
  onMove: (id: string, point: PlanPoint) => void;
  /** Whether a table could be dropped at `point` (live feedback while dragging). */
  canDrop: (id: string, point: PlanPoint) => boolean;
  onDismissNotice: () => void;
  onNewTable: () => void;
};

/**
 * The active space's plan in edit mode (no export; built from the 02 plan): the editable area
 * drawn as a dotted grid, every table of the space (disabled ones too) and the 02 zoom controls.
 * Tables are dragged with pointer events, snapped to the 8px grid and kept inside the area.
 */
export function PlanEditor({
  view,
  transform,
  notice,
  onTransformChange,
  onSelect,
  onMove,
  canDrop,
  onDismissNotice,
  onNewTable,
}: PlanEditorProps) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const suppressClickRef = useRef(false);
  const viewportRef = useRef<HTMLElement>(null);

  const startDrag = (event: PointerEvent<HTMLButtonElement>, table: EditorTable) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = { x: table.x, y: table.y };
    setDrag({ id: table.id, pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin, point: origin, moved: false });
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = { x: event.clientX, y: event.clientY };
    const moved = drag.moved || hasDragged(drag.start, current);
    setDrag({ ...drag, moved, point: moved ? getDragPoint(drag.origin, drag.start, current, transform.scale) : drag.origin });
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>, drop: boolean) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      if (drop && (drag.point.x !== drag.origin.x || drag.point.y !== drag.origin.y)) onMove(drag.id, drag.point);
    }
    setDrag(null);
  };
  const consumeClick = () => {
    const suppressed = suppressClickRef.current;
    suppressClickRef.current = false;
    return suppressed;
  };
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
        {view.tables.map((table) => {
          const dragPoint = drag?.id === table.id && drag.moved ? drag.point : null;
          return (
            <EditorTableButton
              key={table.id}
              table={table}
              dragPoint={dragPoint}
              droppable={dragPoint ? canDrop(table.id, dragPoint) : true}
              onSelect={onSelect}
              onMove={onMove}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerEnd={endDrag}
              consumeClick={consumeClick}
            />
          );
        })}
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

      <p
        id="plan-editor-help"
        className="absolute right-4 bottom-4 rounded-nav bg-surface/90 px-2.5 py-1.5 text-[11px] text-muted outline-1 -outline-offset-[0.5px] outline-line"
      >
        Arrastrá una mesa para ubicarla · Con la mesa enfocada, flechas: 8 px · Shift + flechas: 40 px
      </p>

      <ZoomControls onZoom={zoom} onFit={() => onTransformChange(getFitTransform(PLAN_CORNERS, viewport()))} />
    </section>
  );
}
