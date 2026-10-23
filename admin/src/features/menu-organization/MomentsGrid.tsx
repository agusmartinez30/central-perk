"use client";

import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import { GripVertical, Pencil } from "lucide-react";
import type { MomentCard } from "@/features/moments/moment-catalog";
import { CoverImage, VisibilitySwitch } from "./OrganizationParts";

type MomentsGridProps = {
  cards: MomentCard[];
  onEdit: (id: string) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onReorder: (id: string, toIndex: number) => void;
  onMove: (id: string, step: number) => void;
};

/** Arrow keys on the "Reorder" handle move the moment one step. */
function stepFromKey(event: KeyboardEvent): number {
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") return -1;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") return 1;
  return 0;
}

/**
 * "Moment Grid": two cards per row, in display order. Cards are dragged by their "Reorder"
 * handle (or moved with the arrow keys); the grid scrolls when the session adds moments.
 */
export function MomentsGrid({ cards, onEdit, onVisibilityChange, onReorder, onMove }: MomentsGridProps) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <ul
      aria-label="Momentos de consumo"
      className="grid min-h-0 w-full flex-1 auto-rows-[minmax(264px,1fr)] grid-cols-2 gap-3 overflow-y-auto"
    >
      {cards.map((card, index) => (
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
            "flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-surface outline-1 -outline-offset-[0.5px] outline-line",
            over === card.id && dragged !== card.id && "outline-2 outline-brand",
            dragged === card.id && "opacity-60",
          )}
        >
          <CoverImage src={card.image} alt={`Portada de ${card.title}`} sizes="576px" className="h-[92px] w-full">
            <span
              className={clsx(
                "absolute top-3.5 left-3.5 flex h-6 items-center rounded-xl px-[9px] text-[11px] font-bold",
                card.visible ? "bg-success-bg text-success" : "bg-sand text-muted",
              )}
            >
              {card.visibilityLabel}
            </span>
          </CoverImage>
          <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-[18px] font-bold text-ink">{card.title}</h3>
              <button
                type="button"
                aria-label={`Editar ${card.title}`}
                onClick={() => onEdit(card.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-nav text-brand hover:bg-brand-wash"
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="truncate text-[12px] text-muted">{card.description}</p>
            <p className="flex gap-3 text-[11px] font-semibold whitespace-nowrap text-ink">
              <span>{card.productLabel}</span>
              <span>{card.categoryLabel}</span>
            </p>
            <p className="truncate text-[11px] text-muted">{card.categorySummary || "Sin categorías asociadas"}</p>
            <div className="mt-auto flex items-end justify-between">
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
                className="flex h-8 w-24 cursor-grab items-center gap-[5px] rounded-nav bg-sand px-2 text-muted active:cursor-grabbing"
              >
                <GripVertical size={14} aria-hidden="true" className="shrink-0" />
                <span className="text-[11px] font-semibold whitespace-nowrap">{card.orderLabel}</span>
              </button>
              <VisibilitySwitch
                checked={card.visible}
                label={`Mostrar ${card.title} en la carta`}
                onChange={(visible) => onVisibilityChange(card.id, visible)}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
