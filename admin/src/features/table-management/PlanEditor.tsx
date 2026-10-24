"use client";

import clsx from "clsx";
import { useRef, useState, type PointerEvent } from "react";
import { Map as MapIcon, MoveDiagonal2, Plus, X } from "lucide-react";
import { TableFigure, ZoomControls } from "@/features/tables/FloorPlan";
import { getChairs, getFitTransform, zoomAround, type PlanTransform } from "@/features/tables/floor-plan";
import {
  PLAN_SIZE,
  RESIZE_HANDLES,
  getResizedLayout,
  type PlanPoint,
  type PlanRect,
  type ResizeHandle,
} from "@/features/venue/table-layout";
import type { EditorTable, Notice, PlanView } from "./management-state";
import { RESIZE_CURSORS, getArrowMove, getDragPoint, getGrabZone, hasDragged, isEdgeHandle } from "./plan-drag";

/** The plan opens at 1:1 with the editable area 16px from the corner. */
export const DEFAULT_EDITOR_TRANSFORM: PlanTransform = { scale: 1, x: 16, y: 16 };

/** The whole editable area, so "Ajustar a la vista" shows the plan. */
const PLAN_BOUNDS = [{ x: 0, y: 0, ...PLAN_SIZE }];

/**
 * A press on a table: what it does (move, or resize from a border or corner), where it started,
 * the table's box at that moment and, once it travelled past the threshold, the box drawn now.
 * Every frame starts again from `origin` with the total pointer delta, so snapping never drifts.
 */
type Drag = {
  id: string;
  handle: ResizeHandle | null;
  pointerId: number;
  start: PlanPoint;
  origin: EditorTable;
  rect: PlanRect;
  moved: boolean;
};

const rectOf = ({ x, y, width, height }: PlanRect): PlanRect => ({ x, y, width, height });
const sameRect = (a: PlanRect, b: PlanRect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

type EditorTableProps = {
  table: EditorTable;
  scale: number;
  /** Box while being moved or resized; null at rest. */
  preview: { rect: PlanRect; resizing: boolean } | null;
  /** False while dragged over another table: the drop will be refused. */
  droppable: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, point: PlanPoint) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, table: EditorTable, handle: ResizeHandle | null) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerEnd: (event: PointerEvent<HTMLElement>, drop: boolean) => void;
  /** True right after a drag, so the click that ends it does not reselect. */
  consumeClick: () => boolean;
};

/**
 * A table in edit mode: the 02 figure in neutral colors with its label and capacity; disabled
 * ones dimmed. Drag it to move it, or drag any border or corner to resize it (round tables keep
 * their proportions); the corner badge tells it can be resized. Focused, the arrow keys move it
 * (Shift: 40px).
 */
function EditorTableButton(props: EditorTableProps) {
  const { table, preview, droppable, scale } = props;
  const box = preview?.rect ?? table;
  const chairs = preview?.resizing ? getChairs(table.capacity, box) : table.chairs;
  const refused = preview !== null && !droppable;
  const start = (handle: ResizeHandle) => (event: PointerEvent<HTMLElement>) => {
    // The press starts a resize, not a move of the table underneath.
    event.stopPropagation();
    props.onPointerDown(event, table, handle);
  };
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
        const next = getArrowMove(table, event.key, event.shiftKey, table);
        if (!next) return;
        event.preventDefault();
        props.onMove(table.id, next);
      }}
      onPointerDown={(event) => props.onPointerDown(event, table, null)}
      onPointerMove={props.onPointerMove}
      onPointerUp={(event) => props.onPointerEnd(event, true)}
      onPointerCancel={(event) => props.onPointerEnd(event, false)}
      style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
      className={clsx(
        "group absolute touch-none rounded-[14px] focus-visible:outline-2 focus-visible:outline-brand",
        preview ? "z-10 drop-shadow-[0_8px_16px_#10101026]" : "hover:z-10",
        preview && !preview.resizing ? "cursor-grabbing" : "cursor-grab",
        !table.enabled && !table.selected && !preview && "opacity-45",
      )}
    >
      <TableFigure
        size={box}
        chairs={chairs}
        shape={table.shape}
        chairClass={refused ? "bg-danger-bg" : "bg-[#e9e6e1]"}
        bodyClass={refused ? "bg-danger-bg" : table.enabled ? "bg-surface" : "bg-sand"}
        ringClass={refused ? "outline-danger" : table.selected || preview ? "outline-brand" : null}
      >
        <span className="max-w-full truncate px-2 text-[13px] font-bold whitespace-nowrap text-ink">{table.label}</span>
        <span className="text-[10px] whitespace-nowrap text-muted">{table.capacityLabel}</span>
        {refused ? (
          <span className="text-[10px] font-bold whitespace-nowrap text-danger">No entra acá</span>
        ) : (
          !table.enabled && <span className="text-[10px] font-bold whitespace-nowrap text-muted">Deshabilitada</span>
        )}
      </TableFigure>

      {/* Grab zones on every border and corner, so any table resizes without selecting it first. */}
      {RESIZE_HANDLES.map((handle) => (
        <span
          key={handle}
          aria-hidden="true"
          data-handle={handle}
          onPointerDown={start(handle)}
          style={{ ...getGrabZone(handle, box, scale), cursor: RESIZE_CURSORS[handle] }}
          className="group/handle absolute z-10 flex touch-none items-center justify-center"
        >
          {isEdgeHandle(handle) && (
            // Border highlight while the zone is hovered or dragged.
            <span
              className={clsx(
                "rounded-full bg-brand transition-opacity group-hover/handle:opacity-100",
                handle === "n" || handle === "s" ? "w-full" : "h-full",
                preview?.resizing ? "opacity-60" : "opacity-0",
              )}
              style={handle === "n" || handle === "s" ? { height: 3 / scale } : { width: 3 / scale }}
            />
          )}
        </span>
      ))}

      {/* Resize affordance: the badge on the bottom-right corner tells the table can be resized. */}
      <span
        aria-hidden="true"
        title="Arrastrá un borde para cambiar el tamaño"
        onPointerDown={start("se")}
        style={{
          left: box.width - 11 / scale,
          top: box.height - 11 / scale,
          width: 22 / scale,
          height: 22 / scale,
          cursor: RESIZE_CURSORS.se,
        }}
        className={clsx(
          "absolute z-20 flex touch-none items-center justify-center rounded-full bg-brand text-white shadow-[0_2px_6px_#10101033] transition-opacity",
          table.selected || preview?.resizing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <MoveDiagonal2 strokeWidth={2.5} style={{ width: 13 / scale, height: 13 / scale }} />
      </span>
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
  /** Border or corner drag released; the screen refuses overlaps with a notice. */
  onResize: (id: string, rect: PlanRect) => void;
  /** Whether a table could take `rect` (live feedback while resizing). */
  canResize: (id: string, rect: PlanRect) => boolean;
  onDismissNotice: () => void;
  onNewTable: () => void;
};

/**
 * The active space's plan in edit mode (no export; built from the 02 plan): the editable area
 * drawn as a dotted grid, every table of the space (disabled ones too) and the 02 zoom controls.
 * Tables are moved and resized with pointer events, snapped to the 8px grid and kept inside the
 * area.
 */
export function PlanEditor({
  view,
  transform,
  notice,
  onTransformChange,
  onSelect,
  onMove,
  canDrop,
  onResize,
  canResize,
  onDismissNotice,
  onNewTable,
}: PlanEditorProps) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const suppressClickRef = useRef(false);
  const viewportRef = useRef<HTMLElement>(null);

  const startDrag = (event: PointerEvent<HTMLElement>, table: EditorTable, handle: ResizeHandle | null) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = rectOf(table);
    setDrag({ id: table.id, handle, pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: table, rect, moved: false });
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = { x: event.clientX, y: event.clientY };
    const moved = drag.moved || hasDragged(drag.start, current);
    if (!moved) return;
    const { origin, handle, start } = drag;
    let rect: PlanRect;
    if (handle) {
      const layout = { ...rectOf(origin), shape: origin.shape };
      const scale = transform.scale;
      rect = rectOf(getResizedLayout(layout, origin.capacity, handle, (current.x - start.x) / scale, (current.y - start.y) / scale));
    } else {
      rect = { ...rectOf(origin), ...getDragPoint(origin, start, current, transform.scale, origin) };
    }
    setDrag({ ...drag, moved, rect });
  };
  const endDrag = (event: PointerEvent<HTMLElement>, drop: boolean) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      if (drop && !sameRect(drag.rect, rectOf(drag.origin))) {
        if (drag.handle) onResize(drag.id, drag.rect);
        else onMove(drag.id, { x: drag.rect.x, y: drag.rect.y });
      }
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
          const active = drag?.id === table.id && drag.moved ? drag : null;
          const preview = active ? { rect: active.rect, resizing: active.handle !== null } : null;
          const droppable = !active
            ? true
            : active.handle
              ? canResize(table.id, active.rect)
              : canDrop(table.id, { x: active.rect.x, y: active.rect.y });
          return (
            <EditorTableButton
              key={table.id}
              table={table}
              scale={scale}
              preview={preview}
              droppable={droppable}
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
        className="absolute right-4 bottom-4 flex max-w-[calc(100%-96px)] flex-col items-end gap-0.5 rounded-nav bg-surface/90 px-2.5 py-1.5 text-right text-[11px] text-muted outline-1 -outline-offset-[0.5px] outline-line"
      >
        <span>Arrastrá una mesa para ubicarla · Con la mesa enfocada, flechas: 8 px · Shift + flechas: 40 px</span>
        <span className="flex items-center gap-1">
          <MoveDiagonal2 size={11} aria-hidden="true" className="text-brand" />
          Arrastrá cualquier borde de la mesa para cambiar su tamaño.
        </span>
      </p>

      <ZoomControls onZoom={zoom} onFit={() => onTransformChange(getFitTransform(PLAN_BOUNDS, viewport()))} />
    </section>
  );
}
