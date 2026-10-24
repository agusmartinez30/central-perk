"use client";

import clsx from "clsx";
import { ChevronDown, Circle, Square, Trash2, Users } from "lucide-react";
import type { VenueSpace } from "@/mocks/service-day";
import type { TableShape } from "@/features/venue/table-layout";
import { BarButton, Switch } from "@/features/table-qr/TableQrParts";
import { Field, PickerLabel, fieldClass } from "./FormField";
import type { ManagementAction, TableFormView } from "./management-state";

const SHAPES: readonly { id: TableShape; label: string; icon: typeof Square }[] = [
  { id: "rect", label: "Rectangular", icon: Square },
  { id: "round", label: "Redonda", icon: Circle },
];

type TableFormProps = {
  view: TableFormView;
  spaces: readonly VenueSpace[];
  onAction: (action: ManagementAction) => void;
  onSave: () => void;
};

/**
 * Side-panel table form: the 09B fields (name, space, capacity, internal description, enabled)
 * plus the plan shape. "Eliminar mesa" opens the confirmation, which offers to disable a table
 * whose history must be kept.
 */
export function TableForm({ view, spaces, onAction, onSave }: TableFormProps) {
  const { draft, shape } = view.form;
  const setText = (field: "label" | "capacity" | "description") => (value: string) =>
    onAction({ type: "set-table-field", field, value });

  return (
    <form
      aria-labelledby="table-form-title"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onAction({ type: "cancel" });
      }}
      className="flex w-full flex-col gap-3 rounded-[14px] bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex flex-col gap-1">
        <h3 id="table-form-title" className="text-[14px] font-bold text-ink">
          {view.title}
        </h3>
        <p className="text-[11px] font-semibold text-muted">{view.idLabel}</p>
      </div>

      {view.activeSession && (
        <p className="flex items-start gap-2 rounded-[9px] bg-warning-bg px-3 py-2.5 text-[11px]/[15px] text-ink">
          <Users size={14} aria-hidden="true" className="mt-px shrink-0 text-warning" />
          <span>
            <span className="font-bold text-warning">Sesión activa.</span> No se puede deshabilitar ni eliminar mientras exista una
            cuenta activa.
          </span>
        </p>
      )}

      <Field label="Nombre o número de mesa" error={view.errors.label}>
        {({ id, describedBy }) => (
          <input
            id={id}
            value={draft.label}
            onChange={(event) => setText("label")(event.target.value)}
            aria-invalid={Boolean(view.errors.label)}
            aria-describedby={describedBy}
            maxLength={40}
            className={fieldClass}
          />
        )}
      </Field>
      <div className="flex gap-3">
        <Field label="Espacio" error={view.errors.spaceId}>
          {({ id, describedBy }) => (
            <div className="relative">
              <select
                id={id}
                value={draft.spaceId}
                aria-invalid={Boolean(view.errors.spaceId)}
                aria-describedby={describedBy}
                onChange={(event) => onAction({ type: "set-table-field", field: "spaceId", value: event.target.value })}
                className={`${fieldClass} cursor-pointer appearance-none pr-9`}
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute top-[11px] right-3 text-muted" />
            </div>
          )}
        </Field>
        <Field label="Capacidad" error={view.errors.capacity}>
          {({ id, describedBy }) => (
            <div className="relative">
              <input
                id={id}
                inputMode="numeric"
                value={draft.capacity}
                onChange={(event) => setText("capacity")(event.target.value)}
                aria-invalid={Boolean(view.errors.capacity)}
                aria-describedby={describedBy}
                className={`${fieldClass} pr-20`}
              />
              <span aria-hidden="true" className="pointer-events-none absolute top-[10px] right-[11px] text-[12px] text-muted">
                personas
              </span>
            </div>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <PickerLabel id="table-shape-label">Forma en el plano</PickerLabel>
        <div role="radiogroup" aria-labelledby="table-shape-label" className="flex gap-2">
          {SHAPES.map((option) => {
            const Icon = option.icon;
            const checked = option.id === shape;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onAction({ type: "set-table-shape", shape: option.id })}
                className={clsx(
                  "flex h-9 flex-1 items-center justify-center gap-2 rounded-nav text-[12px] font-bold outline-1 -outline-offset-[0.5px]",
                  checked ? "bg-brand-wash text-brand outline-brand" : "bg-surface text-ink outline-line hover:bg-cream",
                )}
              >
                <Icon size={14} aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Descripción interna · opcional" error={view.errors.description}>
        {({ id, describedBy }) => (
          <input
            id={id}
            value={draft.description}
            onChange={(event) => setText("description")(event.target.value)}
            aria-invalid={Boolean(view.errors.description)}
            aria-describedby={describedBy}
            className={fieldClass}
          />
        )}
      </Field>
      <div className="flex h-[46px] w-full shrink-0 items-center justify-between rounded-[9px] bg-brand-wash px-3">
        <span className="text-[12px] font-bold text-ink">Mesa habilitada</span>
        <Switch
          checked={draft.enabled}
          label="Mesa habilitada"
          onChange={(enabled) => onAction({ type: "set-table-field", field: "enabled", value: enabled })}
        />
      </div>
      <p className="text-[11px] text-muted">El ID interno permanece estable aunque cambie la etiqueta.</p>

      <div className="flex items-center justify-between gap-2 pt-1">
        {view.canRemove ? (
          <button
            type="button"
            onClick={() => onAction({ type: "request-delete" })}
            className="flex h-8 items-center gap-1.5 rounded-nav px-2 text-[11px] font-bold text-danger hover:bg-danger-bg"
          >
            <Trash2 size={13} aria-hidden="true" />
            Eliminar mesa
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <BarButton label="Cancelar" tone="neutral" onClick={() => onAction({ type: "cancel" })} />
          <BarButton label={view.form.id ? "Guardar mesa" : "Crear mesa"} tone="primary" onClick={onSave} />
        </div>
      </div>
      {/* Enter in a field saves, like "Guardar mesa". */}
      <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
    </form>
  );
}
