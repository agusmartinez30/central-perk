"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown, Users } from "lucide-react";
import { TABLE_SECTORS } from "@/mocks/service-day";
import type { TableSector } from "@/mocks/service-day";
import type { EditorView, TableEditorState, TableQrAction } from "./table-qr-state";
import { BarButton, PageHeader, Switch } from "./TableQrParts";

type FieldProps = { label: string; error?: string; children: (props: { id: string; describedBy?: string }) => ReactNode };

/** "Field Label" 9px → 11px above a 36px cream field; the error line is invented. */
function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex w-full flex-col gap-2.5">
      <label htmlFor={id} className="text-[11px] font-bold text-muted">
        {label}
      </label>
      {children({ id, describedBy: error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="-mt-1 text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const fieldClass =
  "h-9 w-full rounded-nav bg-cream px-[11px] text-[12px] text-ink outline-none focus:outline-2 focus:outline-brand aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-danger";

const IDENTITY_RULES = [
  "✓ Identificador único dentro del negocio",
  "✓ Capacidad: entero positivo",
  "✓ El historial nunca se elimina al deshabilitar",
  "✓ Permisos verificados en el servidor",
];

type TableEditorProps = { editor: TableEditorState; view: EditorView; onAction: (action: TableQrAction) => void; onSave: () => void };

/**
 * 09B · Crear y editar mesa ("Table Editor Main"): the stable id bar with Cancelar / Guardar
 * mesa, "Información de la mesa" and the operational rules column ("Sesión activa" only while
 * the table has an open session). Saving only changes this screen's in-memory tables.
 */
export function TableEditor({ editor, view, onAction, onSave }: TableEditorProps) {
  const { draft } = editor;
  const setText = (field: "label" | "capacity" | "description") => (value: string) =>
    onAction({ type: "editor-set-field", field, value });

  return (
    <div className="flex min-h-[calc(100dvh-72px)] flex-col gap-3.5 px-7 py-[18px]">
      <PageHeader title={view.title} subtitle="La etiqueta visible puede cambiar sin alterar la identidad interna." />
      <div className="flex h-11 w-full shrink-0 items-center justify-between rounded-[10px] bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line">
        <p className="text-[11px] font-semibold whitespace-nowrap text-muted">{view.idLabel}</p>
        <div className="flex items-center gap-2">
          <BarButton label="Cancelar" tone="neutral" onClick={() => onAction({ type: "close-editor" })} />
          <BarButton label="Guardar mesa" tone="primary" onClick={onSave} />
        </div>
      </div>

      <div className="flex w-full flex-1 items-stretch gap-4">
        <form
          aria-labelledby="table-form-title"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
          className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-[14px] bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line"
        >
          <h3 id="table-form-title" className="text-[14px] font-bold text-ink">
            Información de la mesa
          </h3>
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
          <Field label="Sector">
            {({ id }) => (
              <div className="relative">
                <select
                  id={id}
                  value={draft.sector}
                  onChange={(event) =>
                    onAction({ type: "editor-set-field", field: "sector", value: event.target.value as TableSector })
                  }
                  className={`${fieldClass} cursor-pointer appearance-none pr-9`}
                >
                  {TABLE_SECTORS.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.label}
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
              onChange={(enabled) => onAction({ type: "editor-set-field", field: "enabled", value: enabled })}
            />
          </div>
          <p className="text-[11px] text-muted">El ID interno permanece estable aunque cambie la etiqueta.</p>
          {/* Enter in a field saves, like "Guardar mesa". */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>

        <aside aria-label="Reglas operativas" className="flex w-[390px] shrink-0 flex-col gap-3">
          {view.activeSession && (
            <section className="flex w-full flex-col gap-2 rounded-card bg-warning-bg p-4">
              <Users size={20} aria-hidden="true" className="text-warning" />
              <h3 className="text-[13px] font-bold text-warning">Sesión activa</h3>
              <p className="w-full text-[12px]/[17px] text-ink">
                La mesa no puede deshabilitarse desde la acción rápida mientras exista una cuenta activa.
              </p>
            </section>
          )}
          <ul className="flex w-full flex-col gap-[9px] rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line">
            {IDENTITY_RULES.map((rule) => (
              <li key={rule} className="text-[11px] text-muted">
                {rule}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
