"use client";

import clsx from "clsx";
import { useId, useRef } from "react";
import { Crop, LockKeyhole, Maximize2, X } from "lucide-react";
import { HeaderSwitch, SaveBar, SaveBarButton, UnsavedBadge } from "@/shared/ui";
import type { MomentEditorState, MomentEditorView, OrganizationAction } from "./organization-state";
import { ExplorePhone } from "./ExplorePhone";
import { MomentProducts } from "./MomentProducts";
import { CoverImage } from "./OrganizationParts";
import { SuggestionSearch } from "./SuggestionSearch";

type MomentEditorProps = {
  editor: MomentEditorState;
  view: MomentEditorView;
  onAction: (action: OrganizationAction) => void;
  /** Opens 08E on the draft ("Ampliar"). */
  onOpenPreview: () => void;
};

type TextFieldProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

/** "Moment Name Field" / "Moment Description Field": 9px label → 11px over a 37px field (10px value → 12px). */
function TextField({ label, value, error, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[5px]">
      <label htmlFor={id} className="text-[11px] font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(
          "h-[37px] w-full rounded-nav bg-surface px-2.5 text-[12px] text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:outline-brand",
          error ? "outline-danger" : "outline-line",
        )}
      />
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** "CARTA DIGITAL / MOMENTOS / …" with "Momentos" back to the list. */
function MomentsBreadcrumb({ items, onBack }: { items: string[]; onBack: () => void }) {
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

/** "General and Cover": 254×134 cover with the 16:9 tag, the size hint and "Reemplazar". */
function CoverEditor({ image, title, onAction }: { image?: string; title: string; onAction: MomentEditorProps["onAction"] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex w-[254px] shrink-0 flex-col gap-[7px]">
      <CoverImage src={image} alt={`Portada de ${title || "momento nuevo"}`} sizes="254px" className="h-[134px] w-full rounded-[9px]">
        <span className="absolute top-2.5 left-2.5 flex h-[23px] items-center gap-[5px] rounded-[7px] bg-surface/90 px-2 text-ink">
          <Crop size={10} aria-hidden="true" />
          <span className="text-[11px] font-bold">RECORTE 16:9</span>
        </span>
      </CoverImage>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAction({ type: "moment-set-image", image: URL.createObjectURL(file) });
          event.target.value = "";
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted">Recomendado: 1600 × 900 px</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-7 items-center rounded-[7px] px-[9px] text-[11px] font-bold text-brand outline-1 -outline-offset-[0.5px] outline-line hover:bg-brand-wash"
        >
          {image ? "Reemplazar" : "Subir foto"}
        </button>
      </div>
    </div>
  );
}

/** "Customer Preview 34%": read-only compact phone of the draft and "Ampliar" into 08E. */
function PreviewColumn({ view, onOpenPreview }: Pick<MomentEditorProps, "view" | "onOpenPreview">) {
  return (
    <aside
      aria-label="Vista previa del cliente"
      className="flex h-full min-w-0 flex-1 flex-col items-center gap-[9px] rounded-card bg-surface px-4 py-3.5 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[14px] font-bold whitespace-nowrap text-ink">Vista previa del cliente</h3>
          <p className="text-[11px] whitespace-nowrap text-muted">Contenido sincronizado</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex h-6 items-center gap-[5px] rounded-xl px-2 text-brand hover:bg-brand-wash"
          >
            <Maximize2 size={10} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Ampliar</span>
          </button>
          <p className="flex h-6 items-center gap-[5px] rounded-xl bg-sand px-2 text-muted">
            <LockKeyhole size={10} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Solo lectura</span>
          </p>
        </div>
      </div>
      <ExplorePhone variant="compact" preview={view.preview} label="Vista previa del momento" className="min-h-0 flex-1" />
    </aside>
  );
}

/**
 * 08B · Crear y editar momento ("Premium Moment Editor Main"): header with the unsaved badge and
 * the visibility switch, the form column ("Información general", "Categorías asociadas",
 * "Productos asociados"), the read-only customer preview and, while there are unsaved changes or
 * after a blocked save, the save bar. Saving only changes the in-memory catalogue of this screen.
 */
export function MomentEditor({ editor, view, onAction, onOpenPreview }: MomentEditorProps) {
  const { draft } = editor;
  const isNew = editor.id === null;
  const close = () => onAction({ type: "close-editor" });

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-2.5 px-7 pt-[18px] pb-3.5">
      <header className="flex min-h-[68px] w-full shrink-0 items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <MomentsBreadcrumb items={view.breadcrumb} onBack={close} />
          <h2 className="text-[25px] leading-tight font-bold whitespace-nowrap text-ink">{view.title}</h2>
          <p className="text-[12px] whitespace-nowrap text-muted">Configurá la presentación y los productos de este momento.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {view.pendingLabel && <UnsavedBadge label={view.pendingLabel} />}
          <HeaderSwitch
            label={draft.visible ? "Visible" : "Oculto"}
            ariaLabel="Visible en la carta"
            checked={draft.visible}
            onChange={(visible) => onAction({ type: "moment-set-visible", visible })}
          />
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 gap-3.5">
        <div className="flex h-full w-[758px] shrink-0 flex-col gap-[13px] overflow-y-auto rounded-card bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line">
          <section aria-labelledby="moment-general" className="flex w-full shrink-0 flex-col gap-[13px]">
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 id="moment-general" className="text-[14px] font-bold text-ink">
                  Información general
                </h3>
                <p className="text-[11px] text-muted">Contenido editorial visible para el cliente</p>
              </div>
              <p className="flex h-7 items-center gap-1.5 rounded-[7px] bg-[#f5f4f0] px-[9px] text-ink">
                <span className="text-[11px] font-bold tracking-[0.5px] text-muted">ORDEN</span>
                <span className="text-[12px] font-bold">{view.order}</span>
              </p>
            </div>
            <div className="flex w-full gap-4">
              <CoverEditor image={draft.image} title={draft.title} onAction={onAction} />
              <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
                <TextField
                  label="Nombre *"
                  value={draft.title}
                  error={view.errors.title}
                  onChange={(value) => onAction({ type: "moment-set-field", field: "title", value })}
                />
                <TextField
                  label="Descripción"
                  value={draft.description}
                  error={view.errors.description}
                  onChange={(value) => onAction({ type: "moment-set-field", field: "description", value })}
                />
              </div>
            </div>
          </section>
          <hr className="w-full shrink-0 border-[#e9e6df]" />

          <section aria-labelledby="moment-categories" className="flex w-full shrink-0 flex-col gap-2.5">
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 id="moment-categories" className="text-[14px] font-bold text-ink">
                  Categorías asociadas
                </h3>
                <p className="text-[11px] text-muted">{view.categoriesHint}</p>
              </div>
              <SuggestionSearch
                compact
                label="Buscar categoría"
                placeholder="Buscar categoría…"
                value={editor.categoryQuery}
                suggestions={view.categorySuggestions.map((category) => ({ id: category.id, label: category.label }))}
                emptyLabel="No hay más categorías con ese nombre."
                onChange={(value) => onAction({ type: "moment-set-query", field: "category", value })}
                onPick={(id) => onAction({ type: "moment-add-category", id })}
              />
            </div>
            <ul aria-label="Categorías seleccionadas" className="flex min-h-[30px] flex-wrap gap-[7px]">
              {view.selectedCategories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-label={`Quitar ${category.label}`}
                    onClick={() => onAction({ type: "moment-remove-category", id: category.id })}
                    className="flex h-[30px] items-center gap-1.5 rounded-[15px] bg-brand-wash px-2.5 text-brand hover:bg-brand/15"
                  >
                    <span className="text-[11px] font-bold whitespace-nowrap">{category.label}</span>
                    <X size={10} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {view.selectedCategories.length === 0 && (
                <li className="flex h-[30px] items-center text-[12px] text-muted">Buscá una categoría para asociarla.</li>
              )}
            </ul>
          </section>
          <hr className="w-full shrink-0 border-[#e9e6df]" />

          <MomentProducts
            hint={view.productsHint}
            rows={view.products}
            pickerOpen={view.productPickerOpen}
            query={editor.productQuery}
            suggestions={view.productSuggestions}
            onAction={onAction}
          />
        </div>
        <PreviewColumn view={view} onOpenPreview={onOpenPreview} />
      </div>

      {(view.dirty || view.saveBar.blocked) && (
        <SaveBar title={view.saveBar.title} hint={view.saveBar.hint} blocked={view.saveBar.blocked}>
          <SaveBarButton
            label={isNew ? "Cancelar" : "Descartar"}
            tone="quiet"
            onClick={() => onAction(isNew ? { type: "close-editor" } : { type: "moment-discard" })}
          />
          <SaveBarButton
            label={isNew ? "Crear momento" : "Guardar cambios"}
            tone="primary"
            onClick={() => onAction({ type: "moment-save" })}
          />
        </SaveBar>
      )}
    </div>
  );
}
