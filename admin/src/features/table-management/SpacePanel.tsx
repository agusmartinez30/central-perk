"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import type { SpaceIcon, SpaceTone } from "@/mocks/service-day";
import type { SpaceCard } from "@/features/venue/space-config";
import { SPACE_ICONS, SPACE_ICON_LABELS, SPACE_TONES, SPACE_TONE_LABELS } from "@/features/venue/space-icons";
import { BarButton } from "@/features/table-qr/TableQrParts";
import { Field, PickerLabel, fieldClass } from "./FormField";
import type { ManagementAction, SpaceFormView } from "./management-state";

const ICONS = Object.keys(SPACE_ICONS) as SpaceIcon[];
const TONES = Object.keys(SPACE_TONES) as SpaceTone[];

export const SPACE_FORM_TITLE_ID = "space-form-title";

type SpaceFormProps = { view: SpaceFormView; onAction: (action: ManagementAction) => void };

/**
 * Space form shown in the modal (invented, from the 09A space cards): name, icon, tone and, for
 * an existing space, "Eliminar", which opens the confirmation.
 */
export function SpaceForm({ view, onAction }: SpaceFormProps) {
  const { form } = view;
  const PreviewIcon = SPACE_ICONS[form.icon];
  const saveLabel = view.saving ? "Guardando…" : view.id ? "Guardar espacio" : "Crear espacio";

  return (
    <form
      aria-labelledby={SPACE_FORM_TITLE_ID}
      aria-busy={view.saving}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onAction({ type: "save-space" });
      }}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex items-center gap-2.5 pr-10">
        <span className={clsx("flex size-8 shrink-0 items-center justify-center rounded-nav", SPACE_TONES[form.tone])}>
          <PreviewIcon size={15} aria-hidden="true" />
        </span>
        <h2 id={SPACE_FORM_TITLE_ID} className="text-[17px] font-bold text-ink">
          {view.title}
        </h2>
      </div>
      <Field label="Nombre del espacio" error={view.error ?? undefined}>
        {({ id, describedBy }) => (
          <input
            id={id}
            value={form.name}
            placeholder="Por ejemplo, Barra"
            maxLength={40}
            aria-invalid={Boolean(view.error)}
            aria-describedby={describedBy}
            onChange={(event) => onAction({ type: "set-space-field", field: "name", value: event.target.value })}
            className={fieldClass}
          />
        )}
      </Field>
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <PickerLabel id="space-icon-label">Ícono</PickerLabel>
          <div role="radiogroup" aria-labelledby="space-icon-label" className="flex gap-1.5">
            {ICONS.map((icon) => {
              const Icon = SPACE_ICONS[icon];
              const checked = icon === form.icon;
              return (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={SPACE_ICON_LABELS[icon]}
                  title={SPACE_ICON_LABELS[icon]}
                  onClick={() => onAction({ type: "set-space-field", field: "icon", value: icon })}
                  className={clsx(
                    "flex size-8 items-center justify-center rounded-nav outline-1 -outline-offset-[0.5px]",
                    checked ? "bg-brand-wash text-brand outline-2 outline-brand" : "bg-surface text-ink outline-line hover:bg-cream",
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <PickerLabel id="space-tone-label">Color</PickerLabel>
          <div role="radiogroup" aria-labelledby="space-tone-label" className="flex gap-1.5">
            {TONES.map((tone) => {
              const checked = tone === form.tone;
              return (
                <button
                  key={tone}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={SPACE_TONE_LABELS[tone]}
                  title={SPACE_TONE_LABELS[tone]}
                  onClick={() => onAction({ type: "set-space-field", field: "tone", value: tone })}
                  className={clsx(
                    "flex size-8 items-center justify-center rounded-nav",
                    SPACE_TONES[tone],
                    checked ? "outline-2 outline-ink" : "outline-1 -outline-offset-[0.5px] outline-line",
                  )}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full bg-current" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        {view.id ? (
          <button
            type="button"
            onClick={() => onAction({ type: "request-delete" })}
            aria-label="Eliminar espacio"
            className="flex h-8 items-center gap-1.5 rounded-nav px-2 text-[11px] font-bold whitespace-nowrap text-danger hover:bg-danger-bg"
          >
            <Trash2 size={13} aria-hidden="true" />
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <BarButton label="Cancelar" tone="neutral" onClick={() => onAction({ type: "cancel" })} />
          <BarButton label={saveLabel} tone="primary" onClick={() => onAction({ type: "save-space" })} />
        </div>
      </div>
      <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
    </form>
  );
}

type SpaceListProps = { cards: readonly SpaceCard[]; activeSpaceId: string; onAction: (action: ManagementAction) => void };

/**
 * "Espacios" beside the plan: the ordered spaces with their table counts (the order also sets
 * the tabs and filters). A row opens its plan; the pencil opens it in the modal to edit it.
 */
export function SpaceList({ cards, activeSpaceId, onAction }: SpaceListProps) {
  return (
    <section
      aria-labelledby="spaces-list-title"
      className="flex w-full flex-col gap-2 rounded-[14px] bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex flex-col gap-0.5">
        <h3 id="spaces-list-title" className="text-[14px] font-bold text-ink">
          Espacios
        </h3>
        <p className="text-[11px] text-muted">El orden se usa en Mesas y en los filtros.</p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {cards.map((card, index) => {
          const Icon = SPACE_ICONS[card.icon];
          const active = card.id === activeSpaceId;
          return (
            <li
              key={card.id}
              className={clsx(
                "flex h-11 items-center gap-1 rounded-[10px] px-2 outline-1 -outline-offset-[0.5px]",
                active ? "bg-brand-wash outline-brand" : "bg-surface outline-line",
              )}
            >
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onAction({ type: "select-space", id: card.id })}
                className="flex min-w-0 flex-1 items-center gap-2.5 pr-1 text-left"
              >
                <span className={clsx("flex size-7 shrink-0 items-center justify-center rounded-chip", SPACE_TONES[card.tone])}>
                  <Icon size={13} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink">{card.name}</span>
                <span className="text-[11px] whitespace-nowrap text-muted">{card.countLabel}</span>
              </button>
              <button
                type="button"
                aria-label={`Editar ${card.name}`}
                title="Editar espacio"
                onClick={() => onAction({ type: "edit-space", id: card.id })}
                className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink hover:bg-cream"
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Subir ${card.name}`}
                disabled={index === 0}
                onClick={() => onAction({ type: "move-space", id: card.id, direction: -1 })}
                className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink enabled:hover:bg-cream disabled:text-line"
              >
                <ArrowUp size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Bajar ${card.name}`}
                disabled={index === cards.length - 1}
                onClick={() => onAction({ type: "move-space", id: card.id, direction: 1 })}
                className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink enabled:hover:bg-cream disabled:text-line"
              >
                <ArrowDown size={13} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
