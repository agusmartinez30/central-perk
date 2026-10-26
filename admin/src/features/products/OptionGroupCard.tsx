"use client";

import { Check, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import type { EditorAction } from "./product-editor-state";
import { formatOptionDelta, parsePriceInput, type OptionDraft } from "./product-form";

type OptionGroupCardProps = {
  groupId: string;
  /** "Tamaño", "Extras", … */
  title: string;
  /** "Selección única · Obligatorio". */
  meta: string;
  options: readonly OptionDraft[];
  editingOptionId: string | null;
  /** Option messages by id, after a blocked save. */
  errors?: Record<string, string>;
  onAction: (action: EditorAction) => void;
};

const ICON_BUTTON = "flex size-6 shrink-0 items-center justify-center rounded-chip hover:bg-cream";

/**
 * "Variant Group · Tamaño" / "Extras Group": option rows with their price adjustment, the pencil
 * to edit a row in place, the trash to remove it and "Agregar opción".
 */
export function OptionGroupCard({ groupId, title, meta, options, editingOptionId, errors, onAction }: OptionGroupCardProps) {
  const titleId = `option-group-${groupId}`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-[9px] overflow-y-auto rounded-card bg-surface p-[13px] outline-1 -outline-offset-[0.5px] outline-line"
    >
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 id={titleId} className="text-[13px] font-bold text-ink">
            {title}
          </h3>
          <p className="text-[11px] font-semibold text-muted">{meta}</p>
        </div>
        {/* "Option Group Menu": the group menu has no design, so the icon stays decorative. */}
        <Ellipsis size={15} aria-hidden="true" className="shrink-0 text-muted" />
      </header>
      <ul className="flex flex-col gap-1.5">
        {options.map((option) => {
          const error = errors?.[option.id];
          const errorId = `${option.id}-error`;
          const label = option.name.trim() || "Opción sin nombre";
          if (option.id === editingOptionId) {
            return (
              <li key={option.id} className="flex flex-col gap-1">
                <div className="flex h-[38px] items-center gap-2 rounded-nav bg-surface px-2.5 outline-2 -outline-offset-1 outline-brand">
                  <input
                    type="text"
                    autoFocus
                    aria-label={`Nombre de la opción de ${title}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    value={option.name}
                    placeholder="Nombre"
                    onChange={(event) =>
                      onAction({ type: "update-option", groupId, id: option.id, changes: { name: event.target.value } })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onAction({ type: "finish-option-edit" });
                    }}
                    className="h-7 min-w-0 flex-1 bg-transparent text-[12px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
                  />
                  <span className="text-[12px] font-bold text-brand">+$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Ajuste de precio de ${label}`}
                    aria-invalid={Boolean(error)}
                    value={option.priceDelta}
                    onChange={(event) =>
                      onAction({ type: "update-option", groupId, id: option.id, changes: { priceDelta: event.target.value } })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onAction({ type: "finish-option-edit" });
                    }}
                    className="h-7 w-16 rounded-chip bg-cream px-1.5 text-right text-[12px] font-bold text-brand outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Listo con ${label}`}
                    onClick={() => onAction({ type: "finish-option-edit" })}
                    className={`${ICON_BUTTON} text-brand`}
                  >
                    <Check size={13} aria-hidden="true" />
                  </button>
                </div>
                {error && (
                  <p id={errorId} className="text-[11px] font-semibold text-danger">
                    {error}
                  </p>
                )}
              </li>
            );
          }
          const delta = parsePriceInput(option.priceDelta);
          return (
            <li key={option.id} className="flex flex-col gap-1">
              <div
                className={`flex h-[38px] items-center gap-2 rounded-nav bg-surface px-2.5 outline-1 -outline-offset-[0.5px] ${error ? "outline-danger" : "outline-line"}`}
              >
                <span className="truncate text-[12px] font-bold text-ink">{label}</span>
                <span aria-hidden="true" className="flex-1" />
                <span className="text-[12px] font-bold whitespace-nowrap text-brand">
                  {delta === null ? option.priceDelta : formatOptionDelta(delta)}
                </span>
                <button
                  type="button"
                  aria-label={`Editar ${label}`}
                  onClick={() => onAction({ type: "edit-option", id: option.id })}
                  className={`${ICON_BUTTON} text-muted hover:text-ink`}
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Quitar ${label}`}
                  onClick={() => onAction({ type: "remove-option", groupId, id: option.id })}
                  className={`${ICON_BUTTON} text-danger`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
              {error && <p className="text-[11px] font-semibold text-danger">{error}</p>}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onAction({ type: "add-option", groupId })}
        className="flex h-[34px] w-fit shrink-0 items-center justify-center gap-1.5 rounded-nav bg-brand-wash px-3 text-brand hover:bg-brand-wash/70"
      >
        <Plus size={13} aria-hidden="true" />
        <span className="text-[11px] font-bold whitespace-nowrap">Agregar opción</span>
      </button>
    </section>
  );
}
