"use client";

import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Package, Pencil } from "lucide-react";
import { RowMenu, type RowMenuItem } from "@/shared/ui";
import type { MomentListCard } from "./organization-state";
import { CoverImage } from "./OrganizationParts";

type MomentsGridProps = {
  cards: MomentListCard[];
  onEdit: (id: string) => void;
  /** Starts the async save; the card shows "Actualizando…" until it settles. */
  onVisibilityChange: (id: string, visible: boolean) => void;
  onReorder: (id: string, toIndex: number) => void;
  onMove: (id: string, step: number) => void;
  /** Opens 08E on this moment. */
  onPreview: (id: string) => void;
};

/** Arrow keys on the "Drag Handle" move the moment one step. */
function stepFromKey(event: KeyboardEvent): number {
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") return -1;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") return 1;
  return 0;
}

const VISIBILITY_TONES = { visible: "text-success", hidden: "text-warning", pending: "text-brand" } as const;

/** "Visibility": state label and the 30×18 toggle; a failed save shows the inline error. */
function MomentVisibility({ card, onChange }: { card: MomentListCard; onChange: (visible: boolean) => void }) {
  const pending = card.visibilityState === "pending";
  const tone = VISIBILITY_TONES[pending ? "pending" : card.visible ? "visible" : "hidden"];
  return (
    <div className="flex shrink-0 flex-col items-end gap-[3px]">
      <span className="flex items-center gap-[7px]">
        <span aria-hidden="true" className={clsx("text-[11px] font-bold whitespace-nowrap", tone)}>
          {card.visibilityLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={card.visible}
          aria-label={`Mostrar ${card.title} en la carta`}
          aria-busy={pending || undefined}
          disabled={pending}
          onClick={() => onChange(!card.visible)}
          className={clsx(
            "flex h-[18px] w-[30px] shrink-0 items-center rounded-[9px] p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            card.visible ? "justify-end bg-brand" : "justify-start bg-[#D4D0C8]",
            pending && "cursor-progress",
          )}
        >
          <span aria-hidden="true" className="size-3.5 rounded-full bg-surface" />
        </button>
      </span>
      {card.visibilityError && (
        <span className="text-[11px] font-bold whitespace-nowrap text-danger">{card.visibilityError}</span>
      )}
    </div>
  );
}

type OrderStepProps = { label: string; icon: typeof ChevronUp; disabled: boolean; onClick: () => void };

/** "Move Up" / "Move Down" of "Accessible Reorder". */
function OrderStep({ label, icon: Icon, disabled, onClick }: OrderStepProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-[6px] text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:text-line disabled:hover:bg-transparent"
    >
      <Icon size={13} aria-hidden="true" />
    </button>
  );
}

/**
 * "Optimized Moment Grid": 2×2 cards in display order (the grid scrolls when the session adds
 * moments). Each card is dragged by its "Drag Handle" (or moved with its arrow keys or the
 * chevrons) and has "Editar" plus a "More Actions" menu. The export's "EN EDICIÓN" state is not
 * reproduced: the editor replaces the list, so no card is ever shown while being edited.
 */
export function MomentsGrid({ cards, onEdit, onVisibilityChange, onReorder, onMove, onPreview }: MomentsGridProps) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [menuCardId, setMenuCardId] = useState<string | null>(null);

  // No design for the menu: the secondary actions the card already implies (invented copy).
  const menuItems = (card: MomentListCard): RowMenuItem[] => {
    const pending = card.visibilityState === "pending";
    return [
      { label: "Vista previa", icon: Eye, disabled: pending || !card.visible, onSelect: () => onPreview(card.id) },
      card.visible
        ? { label: "Ocultar en la carta", icon: EyeOff, disabled: pending, onSelect: () => onVisibilityChange(card.id, false) }
        : { label: "Mostrar en la carta", icon: Eye, disabled: pending, onSelect: () => onVisibilityChange(card.id, true) },
    ];
  };

  return (
    <ul
      aria-label="Momentos de consumo"
      className="grid min-h-0 w-full flex-1 auto-rows-[minmax(282px,1fr)] grid-cols-2 gap-3 overflow-y-auto"
    >
      {cards.map((card, index) => {
        const hidden = !card.visible && card.visibilityState !== "pending";
        return (
          <li
            key={card.id}
            onDragOver={(event) => {
              if (!dragged) return;
              event.preventDefault();
              setOver(card.id);
            }}
            onDragLeave={() => setOver((current) => (current === card.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged && dragged !== card.id) onReorder(dragged, index);
              setDragged(null);
              setOver(null);
            }}
            className={clsx(
              "flex min-w-0 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line",
              over === card.id && dragged !== card.id && "outline-2 outline-brand",
              dragged === card.id && "opacity-60",
            )}
          >
            <CoverImage src={card.image} alt={`Portada de ${card.title}`} sizes="576px" className="h-[134px] w-full">
              {hidden && (
                <span className="absolute inset-0 flex items-center justify-center bg-[#10101066]">
                  <span className="flex h-[26px] items-center gap-[5px] rounded-[13px] bg-[#FFFFFFE8] px-[9px] text-warning">
                    <EyeOff size={12} aria-hidden="true" className="shrink-0" />
                    <span className="text-[11px] font-bold whitespace-nowrap">Oculto en la carta</span>
                  </span>
                </span>
              )}
            </CoverImage>
            <div className="flex min-h-0 flex-1 flex-col gap-[9px] px-5 pt-3.5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <h3 className="truncate text-[15px] font-bold text-ink">{card.title}</h3>
                  <p className="truncate text-[12px] text-muted">{card.description}</p>
                </div>
                <MomentVisibility card={card} onChange={(visible) => onVisibilityChange(card.id, visible)} />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-[25px] shrink-0 items-center gap-[5px] rounded-[7px] bg-[#F5F4F0] px-2 text-ink">
                  <Package size={12} aria-hidden="true" className="shrink-0" />
                  <span className="text-[11px] font-bold whitespace-nowrap">{card.productLabel}</span>
                </span>
                <span title={card.categorySummary} className="truncate text-[11px] text-muted">
                  {card.categorySummary || "Sin categorías asociadas"}
                </span>
              </div>
            </div>
            <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#E9E6DF] bg-[#FAF9F6] px-3.5">
              <div className="flex items-center gap-[7px]">
                <button
                  type="button"
                  draggable
                  aria-label={`Reordenar ${card.title}. ${card.orderLabel}. Usá las flechas para moverlo.`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", card.id);
                    setDragged(card.id);
                  }}
                  onDragEnd={() => {
                    setDragged(null);
                    setOver(null);
                  }}
                  onKeyDown={(event) => {
                    const step = stepFromKey(event);
                    if (!step) return;
                    event.preventDefault();
                    onMove(card.id, step);
                  }}
                  className="flex size-6 cursor-grab items-center justify-center rounded-[6px] text-muted hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand active:cursor-grabbing"
                >
                  <GripVertical size={14} aria-hidden="true" />
                </button>
                <span
                  aria-hidden="true"
                  className="flex size-[26px] items-center justify-center rounded-[7px] bg-surface text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line"
                >
                  {card.order}
                </span>
                <span className="text-[11px] font-bold whitespace-nowrap text-muted">{card.orderLabel}</span>
                <span className="flex items-center gap-0.5">
                  <OrderStep
                    label={`Subir ${card.title}`}
                    icon={ChevronUp}
                    disabled={!card.canMoveUp}
                    onClick={() => onMove(card.id, -1)}
                  />
                  <OrderStep
                    label={`Bajar ${card.title}`}
                    icon={ChevronDown}
                    disabled={!card.canMoveDown}
                    onClick={() => onMove(card.id, 1)}
                  />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Editar ${card.title}`}
                  onClick={() => onEdit(card.id)}
                  className="flex h-[30px] items-center gap-[5px] rounded-nav bg-brand-wash px-2.5 text-brand hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Pencil size={12} aria-hidden="true" className="shrink-0" />
                  <span className="text-[11px] font-bold whitespace-nowrap">Editar</span>
                </button>
                <RowMenu
                  label={`Más acciones para ${card.title}`}
                  items={menuItems(card)}
                  open={menuCardId === card.id}
                  onOpenChange={(open) => setMenuCardId(open ? card.id : null)}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
