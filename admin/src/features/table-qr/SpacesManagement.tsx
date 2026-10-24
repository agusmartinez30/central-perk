"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Check, MapPin, Pencil, Plus, Store, Sun, Trees, X, type LucideIcon } from "lucide-react";
import type { SpaceIcon, SpaceTone } from "@/mocks/service-day";
import type { SpaceCard } from "./space-config";
import type { SpaceEditorView, TableQrAction } from "./table-qr-state";

export const SPACE_ICONS: Record<SpaceIcon, LucideIcon> = { store: Store, sun: Sun, trees: Trees, "map-pin": MapPin };

export const SPACE_TONES: Record<SpaceTone, string> = {
  brand: "bg-brand-wash text-brand",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  neutral: "bg-sand text-muted",
};

const cardClass = "flex h-[58px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line";

/** Inline create / rename form in place of a card (invented: the export only shows the buttons). */
function SpaceForm({ editor, onAction }: { editor: SpaceEditorView; onAction: (action: TableQrAction) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const label = editor.id ? "Nombre del espacio" : "Nombre del nuevo espacio";
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onAction({ type: "space-save" });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onAction({ type: "space-cancel" });
      }}
      className={clsx(cardClass, "gap-2 outline-2 outline-brand")}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <input
          ref={inputRef}
          aria-label={label}
          placeholder={label}
          value={editor.name}
          maxLength={40}
          aria-invalid={Boolean(editor.error)}
          aria-describedby={editor.error ? "space-form-error" : undefined}
          onChange={(event) => onAction({ type: "space-set-name", name: event.target.value })}
          className="h-7 w-full min-w-0 rounded-chip bg-cream px-2 text-[12px] font-semibold text-ink outline-none focus:outline-2 focus:outline-brand"
        />
        {editor.error && (
          <p id="space-form-error" className="truncate text-[11px] font-semibold text-danger">
            {editor.error}
          </p>
        )}
      </div>
      <button type="submit" aria-label="Guardar espacio" className="flex size-7 shrink-0 items-center justify-center rounded-chip bg-brand text-white hover:bg-brand/92">
        <Check size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Cancelar"
        onClick={() => onAction({ type: "space-cancel" })}
        className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink hover:bg-cream"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </form>
  );
}

type SpacesManagementProps = {
  cards: readonly SpaceCard[];
  editor: SpaceEditorView | null;
  onAction: (action: TableQrAction) => void;
};

/**
 * 09A "Spaces Management": "Espacios" with its helper, one 58px card per space (icon on its tone,
 * name, derived table count, "Edit Space") and "Crear espacio". Editing and creating happen in
 * place; the cards scroll sideways when there are many spaces.
 */
export function SpacesManagement({ cards, editor, onAction }: SpacesManagementProps) {
  return (
    <section aria-labelledby="spaces-title" className="flex w-full shrink-0 flex-col gap-[7px]">
      <div className="flex w-full items-center justify-between">
        <h3 id="spaces-title" className="text-[13px] font-bold text-ink">
          Espacios
        </h3>
        <p className="text-[11px] text-muted">Asigná cada mesa al espacio donde está ubicada</p>
      </div>
      <ul className="flex h-[58px] w-full gap-[9px]">
        {cards.map((card) => {
          if (editor && editor.id === card.id) {
            return (
              <li key={card.id} className="flex min-w-0 flex-1">
                <SpaceForm editor={editor} onAction={onAction} />
              </li>
            );
          }
          const Icon = SPACE_ICONS[card.icon];
          return (
            <li key={card.id} className={cardClass}>
              <span className={clsx("flex size-8 shrink-0 items-center justify-center rounded-nav", SPACE_TONES[card.tone])}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-[13px] font-bold text-ink">{card.name}</p>
                <p className="text-[11px] text-muted">{card.countLabel}</p>
              </div>
              <button
                type="button"
                aria-label={`Editar espacio ${card.name}`}
                onClick={() => onAction({ type: "open-space-editor", id: card.id })}
                className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink hover:bg-cream"
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
            </li>
          );
        })}
        <li className="flex min-w-0 flex-1">
          {editor && editor.id === null ? (
            <SpaceForm editor={editor} onAction={onAction} />
          ) : (
            <button
              type="button"
              onClick={() => onAction({ type: "open-space-editor" })}
              className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[10px] bg-brand-wash text-brand outline-1 -outline-offset-[0.5px] outline-brand hover:bg-brand/15"
            >
              <Plus size={15} aria-hidden="true" />
              <span className="text-[12px] font-bold">Crear espacio</span>
            </button>
          )}
        </li>
      </ul>
    </section>
  );
}
