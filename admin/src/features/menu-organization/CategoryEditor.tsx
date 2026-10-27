"use client";

import clsx from "clsx";
import Link from "next/link";
import { useId, useRef, type ReactNode } from "react";
import { ImagePlus, TriangleAlert } from "lucide-react";
import type { CategoryEditorState, CategoryEditorView, OrganizationAction } from "./organization-state";
import { BarButton, CoverImage, EditorStatusBar, PageHeader, VisibilitySwitch } from "./OrganizationParts";

type CategoryEditorProps = {
  editor: CategoryEditorState;
  view: CategoryEditorView;
  onAction: (action: OrganizationAction) => void;
};

type FieldProps = { label: string; error?: string; children: (props: { id: string; describedBy?: string }) => ReactNode };

/** "Field Label" 9px → 11px above a cream field; the error line is invented. */
function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex w-full flex-col gap-3">
      <label htmlFor={id} className="text-[11px] font-bold text-muted">
        {label}
      </label>
      {children({ id, describedBy: error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="-mt-1.5 text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const fieldClass = "w-full rounded-nav bg-cream p-3 text-[12px] text-ink outline-none focus:outline-2 focus:outline-brand";

/**
 * 08D · Crear y editar categoría ("Category Editor Main"): status bar with "Archivar" and
 * "Guardar cambios", "Información de la categoría" (name, optional description, optional image,
 * visibility and order) and the summary column (derived product count, archive card whose
 * "Revisar archivado" opens the confirmation, contextual update info). Saving and archiving only
 * change the in-memory catalogue of this screen.
 */
export function CategoryEditor({ editor, view, onAction }: CategoryEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { draft } = editor;
  // The session object URL plus the 08D metadata; the pixel size is read once the image loads.
  const pickFile = (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    const image = { src: URL.createObjectURL(file), fileName: file.name, width: 0, height: 0, bytes: file.size };
    const probe = new window.Image();
    probe.onload = () =>
      onAction({ type: "category-set-image", image: { ...image, width: probe.naturalWidth, height: probe.naturalHeight } });
    probe.onerror = () => onAction({ type: "category-set-image", image });
    probe.src = image.src;
  };
  const save = () => onAction({ type: "category-save", at: new Date().toISOString() });

  return (
    <div className="flex min-h-[calc(100dvh-72px)] flex-col gap-3 px-7 pt-[18px] pb-4">
      <PageHeader title={view.title} subtitle="Actualizá el filtro sin modificar productos ni pedidos históricos." />
      <EditorStatusBar label={view.statusLabel} dirty={view.dirty}>
        {view.canArchive ? (
          <BarButton label="Archivar" tone="danger" onClick={() => onAction({ type: "category-archive" })} />
        ) : (
          <BarButton label="Cancelar" tone="neutral" onClick={() => onAction({ type: "close-editor" })} />
        )}
        <BarButton
          label="Guardar cambios"
          tone="primary"
          disabled={!view.canSave}
          onClick={save}
        />
      </EditorStatusBar>

      <div className="flex min-h-[658px] w-full flex-1 items-stretch gap-4">
        <section
          aria-labelledby="category-form"
          className="flex min-w-0 flex-1 flex-col gap-3 rounded-card bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line"
        >
          <h3 id="category-form" className="text-[14px] font-bold text-ink">
            Información de la categoría
          </h3>
          <Field label="Nombre" error={view.errors.label}>
            {({ id, describedBy }) => (
              <input
                id={id}
                value={draft.label}
                aria-invalid={view.errors.label ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => onAction({ type: "category-set-field", field: "label", value: event.target.value })}
                className={clsx(fieldClass, "h-10", view.errors.label && "outline-1 outline-danger")}
              />
            )}
          </Field>
          <Field label="Descripción opcional" error={view.errors.description}>
            {({ id, describedBy }) => (
              <textarea
                id={id}
                value={draft.description}
                aria-invalid={view.errors.description ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) =>
                  onAction({ type: "category-set-field", field: "description", value: event.target.value })
                }
                className={clsx(fieldClass, "h-[72px] resize-none", view.errors.description && "outline-1 outline-danger")}
              />
            )}
          </Field>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              pickFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {draft.image ? (
            <CoverImage src={draft.image.src} alt={`Imagen de ${draft.label || "la categoría"}`} sizes="722px" className="h-[150px] w-full rounded-[10px]">
              <span className="absolute right-3 bottom-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-nav bg-surface px-2.5 py-1.5 text-[11px] font-bold text-brand hover:bg-cream"
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  onClick={() => onAction({ type: "category-set-image", image: undefined })}
                  className="rounded-nav bg-surface px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-danger-bg"
                >
                  Quitar
                </button>
              </span>
            </CoverImage>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                pickFile(event.dataTransfer.files[0]);
              }}
              className="flex h-[150px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-[10px] border border-line bg-cream text-brand hover:bg-sand"
            >
              <ImagePlus size={24} aria-hidden="true" />
              <span className="text-[12px] font-semibold">Imagen opcional · Subir o arrastrar</span>
            </button>
          )}
          <div className="flex h-14 w-full shrink-0 items-center justify-between rounded-field bg-cream px-3.5">
            <p className="text-[12px] font-semibold text-ink">{view.settingsLabel}</p>
            <VisibilitySwitch
              checked={draft.visible}
              label="Visible en la carta"
              onChange={(visible) => onAction({ type: "category-set-visible", visible })}
            />
          </div>
        </section>

        <aside aria-label="Resumen de asociaciones" className="flex w-[390px] shrink-0 flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-[14px] bg-brand p-[18px] text-white">
            <p className="text-[11px] font-bold tracking-[0.7px] text-white/67">PRODUCTOS ASOCIADOS</p>
            <p className="text-[38px] leading-tight font-bold">{view.productCount}</p>
            <Link href="/menu/products" className="text-[12px] font-bold hover:underline">
              Revisar productos con esta categoría →
            </Link>
          </div>
          {view.canArchive && (
            <div role={view.confirmingArchive ? "alert" : undefined} className="flex flex-col gap-2 rounded-card bg-danger-bg p-4">
              <TriangleAlert size={20} aria-hidden="true" className="text-danger" />
              <p className="text-[13px] font-bold text-danger">
                {view.confirmingArchive ? view.archiveTitle : view.archiveCard.title}
              </p>
              <p className="text-[12px] leading-4 text-ink">
                {view.confirmingArchive ? view.archiveMessage : view.archiveCard.description}
              </p>
              {!view.confirmingArchive && (
                <button
                  type="button"
                  onClick={() => onAction({ type: "category-archive" })}
                  className="mt-1 flex h-8 w-fit items-center rounded-nav bg-surface px-3 text-[11px] font-bold text-danger hover:bg-cream"
                >
                  {view.archiveCard.actionLabel}
                </button>
              )}
              {view.confirmingArchive && (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onAction({ type: "category-archive" })}
                    className="flex h-8 items-center rounded-nav bg-danger px-3 text-[11px] font-bold text-white hover:bg-danger/90"
                  >
                    Confirmar archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction({ type: "category-cancel-archive" })}
                    className="flex h-8 items-center rounded-nav bg-surface px-3 text-[11px] font-bold text-ink hover:bg-cream"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
          <ul className="flex flex-col gap-2 rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line">
            {view.contextLines.map((line) => (
              <li key={line} className="text-[11px] text-muted">
                {line}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
