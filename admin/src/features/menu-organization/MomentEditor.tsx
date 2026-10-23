"use client";

import clsx from "clsx";
import Link from "next/link";
import { useId, useRef } from "react";
import { X } from "lucide-react";
import type { MomentEditorState, MomentEditorView, OrganizationAction } from "./organization-state";
import { ExplorePhone } from "./ExplorePhone";
import { BarButton, CoverImage, EditorStatusBar, PageHeader, VisibilitySwitch } from "./OrganizationParts";
import { SuggestionSearch } from "./SuggestionSearch";

type MomentEditorProps = {
  editor: MomentEditorState;
  view: MomentEditorView;
  onAction: (action: OrganizationAction) => void;
  onOpenPreview?: () => void;
};

type TextFieldProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

/** "Field Label" 9px → 11px over a 36px cream field (10px value → 12px). */
function TextField({ label, value, error, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[9px]">
      <label htmlFor={id} className="text-[11px] font-bold text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(
          "h-9 w-full rounded-nav bg-cream px-2.5 text-[12px] text-ink outline-none focus:outline-2 focus:outline-brand",
          error && "outline-1 outline-danger",
        )}
      />
      {error && (
        <p id={`${id}-error`} className="-mt-1 text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const cardClass = "rounded-card bg-surface p-3.5 outline-1 -outline-offset-[0.5px] outline-line";

/**
 * 08B · Crear y editar momento ("Moment Editor Main"): status bar, "Información general",
 * "Fotografía de portada", "Categorías asociadas", "Productos asociados" and the live phone
 * preview of the draft. Saving only changes the in-memory catalogue of this screen.
 */
export function MomentEditor({ editor, view, onAction, onOpenPreview }: MomentEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { draft } = editor;

  return (
    <div className="flex min-h-[calc(100dvh-72px)] flex-col gap-3 px-7 pt-[18px] pb-4">
      <PageHeader title={view.title} subtitle="Configurá el contenido editorial sin duplicar productos." />
      <EditorStatusBar label={view.statusLabel} dirty={view.dirty}>
        {editor.id === null ? (
          <BarButton label="Cancelar" tone="neutral" onClick={() => onAction({ type: "close-editor" })} />
        ) : (
          <BarButton
            label="Descartar"
            tone="neutral"
            disabled={!view.canDiscard}
            onClick={() => onAction({ type: "moment-discard" })}
          />
        )}
        <BarButton
          label="Guardar cambios"
          tone="primary"
          disabled={!view.canSave}
          onClick={() => onAction({ type: "moment-save" })}
        />
      </EditorStatusBar>

      <div className="flex min-h-[658px] w-full flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <section aria-labelledby="moment-general" className={clsx(cardClass, "flex flex-col gap-[9px]")}>
            <h3 id="moment-general" className="text-[13px] font-bold text-ink">
              Información general
            </h3>
            <TextField
              label="Nombre del momento"
              value={draft.title}
              error={view.errors.title}
              onChange={(value) => onAction({ type: "moment-set-field", field: "title", value })}
            />
            <TextField
              label="Descripción breve"
              value={draft.description}
              error={view.errors.description}
              onChange={(value) => onAction({ type: "moment-set-field", field: "description", value })}
            />
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-ink">{view.publicationLabel}</p>
              <VisibilitySwitch
                checked={draft.visible}
                label="Visible en la carta"
                onChange={(visible) => onAction({ type: "moment-set-visible", visible })}
              />
            </div>
          </section>

          <div className="flex min-h-[267px] w-full flex-1 gap-2.5">
            <section aria-labelledby="moment-cover" className={clsx(cardClass, "flex min-w-0 flex-1 flex-col gap-2.5")}>
              <h3 id="moment-cover" className="text-[12px] font-bold text-ink">
                Fotografía de portada · 4:5
              </h3>
              <CoverImage
                src={draft.image}
                alt={`Portada de ${draft.title || "momento nuevo"}`}
                sizes="346px"
                className="h-[196px] w-full rounded-[9px]"
              >
                {draft.image && (
                  <span className="absolute top-3 left-3 rounded-[7px] bg-ink/72 px-2 py-[5px] text-[11px] font-bold text-white">
                    4:5 · Optimizada
                  </span>
                )}
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
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-brand hover:underline">
                  {draft.image ? "Reemplazar" : "Subir foto"}
                </button>
                <button type="button" disabled className="cursor-not-allowed text-brand opacity-50" title="Sin diseño">
                  Recortar
                </button>
                <button
                  type="button"
                  disabled={!onOpenPreview}
                  onClick={onOpenPreview}
                  className="text-brand enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Vista previa
                </button>
                <button
                  type="button"
                  disabled={!draft.image}
                  onClick={() => onAction({ type: "moment-set-image", image: undefined })}
                  className="text-danger enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            </section>

            <section aria-labelledby="moment-categories" className={clsx(cardClass, "flex min-w-0 flex-1 flex-col gap-2.5")}>
              <h3 id="moment-categories" className="text-[12px] font-bold text-ink">
                Categorías asociadas
              </h3>
              <SuggestionSearch
                label="Buscar categorías"
                placeholder="Buscar categorías…"
                value={editor.categoryQuery}
                suggestions={view.categorySuggestions.map((category) => ({ id: category.id, label: category.label }))}
                emptyLabel="No hay más categorías con ese nombre."
                onChange={(value) => onAction({ type: "moment-set-query", field: "category", value })}
                onPick={(id) => onAction({ type: "moment-add-category", id })}
              />
              <ul aria-label="Categorías seleccionadas" className="flex flex-wrap gap-1.5">
                {view.selectedCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      aria-label={`Quitar ${category.label}`}
                      onClick={() => onAction({ type: "moment-remove-category", id: category.id })}
                      className="flex items-center rounded-[14px] bg-brand-wash px-[9px] py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/15"
                    >
                      {category.label} ×
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted">Las categorías no agregan productos automáticamente.</p>
            </section>
          </div>

          <section aria-labelledby="moment-products" className={clsx(cardClass, "flex h-[220px] flex-col gap-2")}>
            <h3 id="moment-products" className="text-[12px] font-bold text-ink">
              {view.productsTitle}
            </h3>
            <SuggestionSearch
              label="Buscar productos existentes"
              placeholder="Buscar productos existentes…"
              value={editor.productQuery}
              suggestions={view.productSuggestions.map((product) => ({ id: product.id, label: product.name }))}
              emptyLabel="No hay productos sin asociar con ese nombre."
              onChange={(value) => onAction({ type: "moment-set-query", field: "product", value })}
              onPick={(id) => onAction({ type: "moment-add-product", id })}
            />
            <ul aria-label="Productos asociados" className="-mb-1 min-h-0 flex-1 overflow-y-auto">
              {view.products.map((product) => (
                <li key={product.id} className="flex h-[41.5px] items-center justify-between border-b border-line">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-bold text-ink">{product.name}</p>
                    <p className={clsx("text-[11px]", product.available ? "text-success" : "text-warning")}>
                      {product.availabilityLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link href="/menu/products" className="text-[11px] font-semibold text-brand hover:underline">
                      Editar en ADMIN 07
                    </Link>
                    <button
                      type="button"
                      aria-label={`Quitar ${product.name} del momento`}
                      onClick={() => onAction({ type: "moment-remove-product", id: product.id })}
                      className="flex size-6 items-center justify-center rounded-nav text-danger hover:bg-danger-bg"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
              {view.products.length === 0 && (
                <li className="py-3 text-[12px] text-muted">Buscá productos existentes para sumarlos a este momento.</li>
              )}
            </ul>
          </section>
        </div>

        <ExplorePhone
          preview={view.preview}
          label="Vista previa del cliente"
          onFilterChange={(filterId) => onAction({ type: "set-preview-filter", filterId })}
          className="self-stretch"
        />
      </div>
    </div>
  );
}
