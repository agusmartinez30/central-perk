"use client";

import clsx from "clsx";
import Link from "next/link";
import { useId, useRef, type ReactNode } from "react";
import { ArrowRight, Check, History, ImagePlus, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { HeaderSwitch, SaveBar, SaveBarButton, UnsavedBadge } from "@/shared/ui";
import type {
  CategoryContextLine,
  CategoryEditorState,
  CategoryEditorView,
  OrganizationAction,
} from "./organization-state";
import { CoverImage } from "./OrganizationParts";

type CategoryEditorProps = {
  editor: CategoryEditorState;
  view: CategoryEditorView;
  onAction: (action: OrganizationAction) => void;
};

type FieldProps = {
  label: string;
  value: string;
  error?: string;
  multiline?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

/** "Category Name Field" (40px) / "Category Description Field" (64px): 9px label → 11px, 10px value → 12px. */
function Field({ label, value, error, multiline = false, className, onChange }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const fieldClass = clsx(
    "w-full rounded-nav bg-surface p-[11px] text-[12px] leading-[16px] text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:outline-brand",
    error ? "outline-danger" : "outline-line",
  );
  const shared = {
    id,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  } as const;
  return (
    <div className={clsx("flex flex-col gap-[5px]", className)}>
      <label htmlFor={id} className="text-[11px] font-bold text-ink">
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} onChange={(event) => onChange(event.target.value)} className={clsx(fieldClass, "h-16 resize-none")} />
      ) : (
        <input {...shared} onChange={(event) => onChange(event.target.value)} className={clsx(fieldClass, "h-10")} />
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** "CARTA DIGITAL / CATEGORÍAS / …" with "Categorías" back to the list. */
function CategoriesBreadcrumb({ items, onBack }: { items: string[]; onBack: () => void }) {
  const [root, section, current] = items;
  return (
    <nav aria-label="Ruta" className="text-[11px] font-bold tracking-[0.6px] whitespace-nowrap text-brand uppercase">
      {root} /{" "}
      <button type="button" onClick={onBack} className="uppercase underline-offset-2 hover:underline">
        {section}
      </button>{" "}
      / <span aria-current="page">{current}</span>
    </nav>
  );
}

type ImageFieldProps = { view: CategoryEditorView; label: string; onAction: CategoryEditorProps["onAction"] };

/** "Optional Image Header" and "Loaded Image Section" (300px photo with its metadata) or the upload area. */
function CategoryImageField({ view, label, onAction }: ImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
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
  const { image } = view;

  return (
    <section aria-labelledby="category-image" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h4 id="category-image" className="text-[13px] font-bold text-ink">
            Imagen de categoría
          </h4>
          <p className="text-[11px] text-muted">JPG o PNG · Máx. 5 MB · Recomendado 1200 × 600 px</p>
        </div>
        <span className="flex h-[22px] items-center rounded-[6px] bg-sand px-2 text-[11px] font-bold tracking-[0.5px] text-muted">
          OPCIONAL
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          pickFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {image ? (
        <div className="flex h-[164px] gap-3.5">
          <CoverImage src={image.src} alt={`Imagen de ${label || "la categoría"}`} sizes="300px" className="h-full w-[300px] rounded-[10px]" />
          <div className="flex min-w-0 flex-col justify-center gap-2.5">
            <p className="flex h-6 w-fit items-center gap-[5px] rounded-[7px] bg-success-bg px-2 text-success">
              <Check size={10} aria-hidden="true" />
              <span className="text-[11px] font-bold">Imagen cargada</span>
            </p>
            <p className="truncate text-[12px] font-bold text-ink">{image.fileName}</p>
            <p className="text-[11px] text-muted">{image.metaLabel}</p>
            <div className="flex gap-[7px]">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-[30px] items-center rounded-nav px-2.5 text-[11px] font-bold text-brand outline-1 -outline-offset-[0.5px] outline-line hover:bg-brand-wash"
              >
                Reemplazar
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: "category-set-image", image: undefined })}
                className="flex h-[30px] items-center rounded-nav px-[9px] text-[11px] font-bold text-danger hover:bg-danger-bg"
              >
                Eliminar imagen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            pickFile(event.dataTransfer.files[0]);
          }}
          className="flex h-[164px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-line bg-[#FAF9F6] text-brand hover:bg-cream"
        >
          <ImagePlus size={22} aria-hidden="true" />
          <span className="text-[12px] font-semibold">Imagen opcional · Subir o arrastrar</span>
        </button>
      )}
    </section>
  );
}

type SettingTileProps = { title: string; description: string; children: ReactNode };

/** "Visibility Setting" / "Position Information": 64px cream tiles. */
function SettingTile({ title, description, children }: SettingTileProps) {
  return (
    <div className="flex h-16 min-w-0 flex-1 items-center justify-between gap-3 rounded-field bg-[#FAF9F6] px-3 outline-1 -outline-offset-[0.5px] outline-[#E9E6DF]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[12px] font-bold text-ink">{title}</p>
        <p className="truncate text-[11px] text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

const CONTEXT_ICONS: Record<CategoryContextLine["kind"], LucideIcon> = {
  updated: History,
  editor: UserRound,
  permission: ShieldCheck,
};

/** "Archive Context Action": card, then the existing confirmation once "Revisar archivado" is pressed. */
function ArchiveCard({ view, onAction }: Pick<CategoryEditorProps, "view" | "onAction">) {
  const confirming = view.confirmingArchive;
  return (
    <div
      role={confirming ? "alert" : undefined}
      className={clsx(
        "flex flex-col gap-[9px] rounded-card p-4 outline-1 -outline-offset-[0.5px]",
        confirming ? "bg-danger-bg outline-danger/30" : "bg-surface outline-line",
      )}
    >
      <p className={clsx("text-[13px] font-bold", confirming ? "text-danger" : "text-ink")}>{confirming ? view.archiveTitle : view.archiveCard.title}</p>
      <p className="text-[11px] leading-[15px] text-muted">
        {confirming ? view.archiveMessage : view.archiveCard.description}
      </p>
      {confirming ? (
        <div className="flex gap-2">
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
            className="flex h-8 items-center rounded-nav bg-surface px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAction({ type: "category-archive" })}
          className="flex h-8 w-fit items-center rounded-nav px-2.5 text-[11px] font-bold text-danger outline-1 -outline-offset-[0.5px] outline-line hover:bg-danger-bg"
        >
          {view.archiveCard.actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * 08D · Crear y editar categoría ("Premium Category Editor Main"): header with the unsaved badge
 * and the visibility switch, "Información de la categoría" (name, description, optional image,
 * visibility and order tiles), the side panel (derived products breakdown, contextual update
 * info, archive review) and, while there are unsaved changes or after a blocked save, the save
 * bar. Saving and archiving only change the in-memory catalogue of this screen.
 */
export function CategoryEditor({ editor, view, onAction }: CategoryEditorProps) {
  const { draft } = editor;
  const isNew = editor.id === null;
  const close = () => onAction({ type: "close-editor" });
  const setVisible = (visible: boolean) => onAction({ type: "category-set-visible", visible });
  const { breakdown } = view;
  const details = [
    ["Visibles en la carta", breakdown.visible],
    ["No disponible", breakdown.unavailable],
    ["Momentos vinculados", breakdown.moments],
  ] as const;

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-2.5 px-7 pt-[18px] pb-3.5">
      <header className="flex min-h-[68px] w-full shrink-0 items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <CategoriesBreadcrumb items={view.breadcrumb} onBack={close} />
          <h2 className="text-[25px] leading-tight font-bold whitespace-nowrap text-ink">{view.title}</h2>
          <p className="text-[12px] whitespace-nowrap text-muted">
            {isNew ? "Definí cómo se presenta esta categoría en la carta." : "Actualizá cómo se presenta esta categoría en la carta."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {view.pendingLabel && <UnsavedBadge label={view.pendingLabel} />}
          <HeaderSwitch
            label={draft.visible ? "Visible" : "Oculta"}
            ariaLabel="Visible en la carta"
            checked={draft.visible}
            onChange={setVisible}
          />
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 gap-3.5">
        <section
          aria-labelledby="category-form"
          className="flex max-h-full w-[758px] shrink-0 flex-col gap-4 self-start overflow-y-auto rounded-card bg-surface p-5 outline-1 -outline-offset-[0.5px] outline-line"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 id="category-form" className="text-[14px] font-bold text-ink">
                Información de la categoría
              </h3>
              <p className="text-[11px] text-muted">Nombre, descripción e imagen visible para el cliente</p>
            </div>
            <p className="flex h-7 items-center gap-1.5 rounded-[7px] bg-[#F5F4F0] px-[9px] text-ink">
              <span className="text-[11px] font-bold tracking-[0.5px] text-muted">POSICIÓN</span>
              <span className="text-[12px] font-bold">{view.positionLabel}</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Field
              label="Nombre *"
              value={draft.label}
              error={view.errors.label}
              className="w-[260px]"
              onChange={(value) => onAction({ type: "category-set-field", field: "label", value })}
            />
            <Field
              label="Descripción opcional"
              value={draft.description}
              error={view.errors.description}
              multiline
              className="min-w-0 flex-1"
              onChange={(value) => onAction({ type: "category-set-field", field: "description", value })}
            />
          </div>
          <hr className="w-full shrink-0 border-[#E9E6DF]" />
          <CategoryImageField view={view} label={draft.label} onAction={onAction} />
          <hr className="w-full shrink-0 border-[#E9E6DF]" />
          <div className="flex gap-3">
            <SettingTile
              title="Visibilidad"
              description={draft.visible ? "Visible en la carta digital" : "Oculta en la carta digital"}
            >
              <button
                type="button"
                role="switch"
                aria-checked={draft.visible}
                aria-label="Visible en la carta digital"
                onClick={() => setVisible(!draft.visible)}
                className={clsx(
                  "flex h-5 w-[34px] shrink-0 items-center rounded-[10px] p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  draft.visible ? "justify-end bg-brand" : "justify-start bg-[#D4D0C8]",
                )}
              >
                <span aria-hidden="true" className="size-4 rounded-full bg-surface" />
              </button>
            </SettingTile>
            <SettingTile title="Orden de visualización" description="Se administra desde Categorías">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface text-[12px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line">
                {view.positionLabel}
              </span>
            </SettingTile>
          </div>
        </section>

        <aside aria-label="Contexto de la categoría" className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
          <div className="flex flex-col gap-[13px] rounded-card bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[14px] font-bold text-ink">Productos asociados</h3>
                <p className="text-[11px] text-muted">Contenido actual de la categoría</p>
              </div>
              <p className="text-[26px] leading-tight font-bold text-brand">{breakdown.total}</p>
            </div>
            <hr className="border-[#E9E6DF]" />
            <dl className="flex flex-col gap-2.5">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-[11px] text-muted">{label}</dt>
                  <dd className="text-[12px] font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/menu/products"
              className="flex h-9 items-center justify-center gap-1.5 rounded-nav bg-brand-wash text-brand hover:bg-brand/15"
            >
              <span className="text-[11px] font-bold">Revisar productos</span>
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 rounded-card bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line">
            <h3 className="text-[14px] font-bold text-ink">Información contextual</h3>
            <ul className="flex flex-col gap-2.5">
              {view.contextLines.map((line) => {
                const Icon = CONTEXT_ICONS[line.kind];
                return (
                  <li key={line.kind} className="flex items-center gap-2 text-[11px] text-muted">
                    <Icon size={13} aria-hidden="true" className="shrink-0" />
                    {line.text}
                  </li>
                );
              })}
            </ul>
          </div>
          {view.canArchive && <ArchiveCard view={view} onAction={onAction} />}
        </aside>
      </div>

      {(view.dirty || view.saveBar.blocked) && (
        <SaveBar title={view.saveBar.title} hint={view.saveBar.hint} blocked={view.saveBar.blocked}>
          <SaveBarButton
            label={isNew ? "Cancelar" : "Descartar"}
            tone="quiet"
            onClick={() => onAction(isNew ? { type: "close-editor" } : { type: "category-discard" })}
          />
          <SaveBarButton
            label={isNew ? "Crear categoría" : "Guardar cambios"}
            tone="primary"
            onClick={() => onAction({ type: "category-save", at: new Date().toISOString() })}
          />
        </SaveBar>
      )}
    </div>
  );
}
