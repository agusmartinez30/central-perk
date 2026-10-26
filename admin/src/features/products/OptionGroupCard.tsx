"use client";

import clsx from "clsx";
import { Check, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import type { OptionSelection } from "@/mocks/service-day";
import type { EditorAction } from "./product-editor-state";
import { getOptionPriceLabel, parsePriceInput, type OptionGroupDraft, type OptionGroupErrors } from "./product-form";

type OptionGroupCardProps = {
  group: OptionGroupDraft;
  /** "Selección única · Obligatorio". */
  meta: string;
  /** The group settings (title, selection, required, maximum) are open. */
  editingGroup: boolean;
  editingOptionId: string | null;
  /** Messages of this group after a blocked save. */
  errors?: OptionGroupErrors;
  onAction: (action: EditorAction) => void;
};

const ICON_BUTTON = "flex shrink-0 items-center justify-center rounded-chip hover:bg-cream";
const SETTING_INPUT =
  "h-8 rounded-nav bg-surface px-2 text-[12px] text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:-outline-offset-1 focus:outline-brand";

/** Title, selection, required and maximum of the group, opened from the group header. */
function GroupSettings({ group, errors, onAction }: Pick<OptionGroupCardProps, "group" | "errors" | "onAction">) {
  const groupId = group.id;
  const titleErrorId = `${groupId}-title-error`;
  return (
    <div className="flex flex-col gap-2 rounded-nav bg-surface p-2.5 outline-1 -outline-offset-[0.5px] outline-line">
      <input
        type="text"
        autoFocus
        aria-label="Nombre del grupo"
        aria-invalid={Boolean(errors?.title)}
        aria-describedby={errors?.title ? titleErrorId : undefined}
        value={group.title}
        placeholder="Nombre del grupo"
        onChange={(event) => onAction({ type: "rename-group", groupId, title: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Enter") onAction({ type: "finish-group-edit" });
        }}
        className={clsx(SETTING_INPUT, "w-full font-bold", errors?.title ? "outline-danger" : "outline-line")}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Tipo de selección"
          value={group.selection}
          onChange={(event) =>
            onAction({ type: "set-group-selection", groupId, selection: event.target.value as OptionSelection })
          }
          className={clsx(SETTING_INPUT, "cursor-pointer outline-line")}
        >
          <option value="single">Selección única</option>
          <option value="multiple">Selección múltiple</option>
        </select>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(event) => onAction({ type: "set-group-required", groupId, required: event.target.checked })}
            className="size-3.5 accent-brand"
          />
          Obligatorio
        </label>
        {group.selection === "multiple" && (
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
            Máximo
            <input
              type="number"
              min={1}
              inputMode="numeric"
              aria-invalid={Boolean(errors?.max)}
              value={group.max ?? ""}
              placeholder="—"
              onChange={(event) =>
                onAction({
                  type: "set-group-max",
                  groupId,
                  max: event.target.value === "" ? undefined : Number(event.target.value),
                })
              }
              className={clsx(SETTING_INPUT, "w-14", errors?.max ? "outline-danger" : "outline-line")}
            />
          </label>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onAction({ type: "remove-group", groupId })}
          className="flex h-7 items-center gap-1 rounded-[7px] px-1.5 text-danger hover:bg-danger-bg"
        >
          <Trash2 size={11} aria-hidden="true" />
          <span className="text-[11px] font-bold">Quitar grupo</span>
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: "finish-group-edit" })}
          className="flex h-7 items-center rounded-[7px] bg-brand px-2.5 text-[11px] font-bold text-white hover:bg-brand/92"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

/**
 * "Group · Tamaño" / "Group · Extras": the group title and rule, its option rows with the price
 * label ("Incluido", "Sin cargo", "+$800"), the pencil to edit a row in place, the trash to remove
 * it, "Agregar opción" and the group settings.
 */
export function OptionGroupCard({ group, meta, editingGroup, editingOptionId, errors, onAction }: OptionGroupCardProps) {
  const groupId = group.id;
  const titleId = `option-group-${groupId}`;
  const title = group.title.trim() || "Grupo sin nombre";
  const optionErrors = errors?.options;
  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-[7px] rounded-[9px] bg-[#faf9f6] p-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-px">
          <h4 id={titleId} className="truncate text-[13px] font-bold text-ink">
            {title}
          </h4>
          <p className="text-[11px] text-muted">{meta}</p>
        </div>
        <button
          type="button"
          aria-label={`Configurar ${title}`}
          aria-expanded={editingGroup}
          onClick={() => onAction(editingGroup ? { type: "finish-group-edit" } : { type: "edit-group", groupId })}
          className={clsx(ICON_BUTTON, "size-6", editingGroup ? "bg-brand-wash text-brand" : "text-muted hover:text-ink")}
        >
          <Settings2 size={14} aria-hidden="true" />
        </button>
      </header>
      {editingGroup && <GroupSettings group={group} errors={errors} onAction={onAction} />}
      {(errors?.title || errors?.max) && (
        <p className="text-[11px] font-semibold text-danger">{[errors.title, errors.max].filter(Boolean).join(" ")}</p>
      )}
      <ul className="flex flex-col gap-[3px]">
        {group.options.map((option) => {
          const error = optionErrors?.[option.id];
          const errorId = `${option.id}-error`;
          const label = option.name.trim() || "Opción sin nombre";
          if (option.id === editingOptionId) {
            return (
              <li key={option.id} className="flex flex-col gap-1">
                <div className="flex h-[30px] items-center gap-1.5 rounded-[6px] bg-surface px-[7px] outline-1 -outline-offset-[0.5px] outline-brand">
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
                    className="h-6 min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
                  />
                  <span aria-hidden="true" className="text-[11px] font-bold text-ink">
                    +$
                  </span>
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
                    className="h-6 w-14 rounded-chip bg-cream px-1.5 text-right text-[11px] font-bold text-ink outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Listo con ${label}`}
                    onClick={() => onAction({ type: "finish-option-edit" })}
                    className={`${ICON_BUTTON} size-6 text-brand`}
                  >
                    <Check size={12} aria-hidden="true" />
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
                className={clsx(
                  "flex h-[30px] items-center justify-between gap-2 rounded-[6px] px-[7px]",
                  error && "bg-surface outline-1 -outline-offset-[0.5px] outline-danger",
                )}
              >
                <span className="truncate text-[12px] font-semibold text-ink">{label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <span
                    className={clsx(
                      "mr-1 text-[11px] font-bold whitespace-nowrap",
                      delta === null ? "text-danger" : delta === 0 ? "text-success" : "text-ink",
                    )}
                  >
                    {delta === null ? option.priceDelta : getOptionPriceLabel(delta, group.required)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Editar ${label}`}
                    onClick={() => onAction({ type: "edit-option", id: option.id })}
                    className={`${ICON_BUTTON} size-5 text-muted hover:text-ink`}
                  >
                    <Pencil size={11} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Quitar ${label}`}
                    onClick={() => onAction({ type: "remove-option", groupId, id: option.id })}
                    className={`${ICON_BUTTON} size-5 text-muted hover:text-danger`}
                  >
                    <Trash2 size={11} aria-hidden="true" />
                  </button>
                </span>
              </div>
              {error && <p className="text-[11px] font-semibold text-danger">{error}</p>}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onAction({ type: "add-option", groupId })}
        className="flex h-[27px] w-fit shrink-0 items-center gap-[5px] rounded-chip px-1 text-brand hover:bg-brand-wash"
      >
        <Plus size={11} aria-hidden="true" />
        <span className="text-[11px] font-bold whitespace-nowrap">Agregar opción</span>
      </button>
    </section>
  );
}
