"use client";

import clsx from "clsx";
import { useId, useRef, type ReactNode } from "react";
import { CONSUMPTION_MOMENTS, PRODUCT_CATEGORIES, type ProductCategoryId } from "@/mocks/service-day";
import type { EditorAction } from "./product-editor-state";
import type { ProductDraft, ProductFormErrors } from "./product-form";
import { ProductImage } from "./ProductTags";

type OnAction = (action: EditorAction) => void;

const INPUT_CLASSES =
  "h-9 w-full rounded-nav bg-surface px-[9px] text-[12px] font-semibold text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:-outline-offset-1 focus:outline-brand";

type FieldProps = {
  label: string;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => ReactNode;
};

/** "Product Field · …": 11px label over a 36px input, with the error below when there is one. */
function Field({ label, error, className, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[11px] font-bold whitespace-nowrap text-muted">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
        className: clsx(INPUT_CLASSES, error ? "outline-danger" : "outline-line"),
      })}
      {error && (
        <p id={errorId} className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type SectionProps = { draft: ProductDraft; errors: ProductFormErrors; onAction: OnAction };

/** "General Information": name, description, base price and category. */
export function GeneralInformation({ draft, errors, onAction }: SectionProps) {
  return (
    <section
      aria-labelledby="general-information-title"
      className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-card bg-surface p-3.5 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <h3 id="general-information-title" className="text-[14px] font-bold text-ink">
        Información general
      </h3>
      <Field label="Nombre del producto" error={errors.name}>
        {(props) => (
          <input
            {...props}
            type="text"
            value={draft.name}
            onChange={(event) => onAction({ type: "set-field", field: "name", value: event.target.value })}
          />
        )}
      </Field>
      <Field label="Descripción" error={errors.description}>
        {(props) => (
          <input
            {...props}
            type="text"
            value={draft.description}
            onChange={(event) => onAction({ type: "set-field", field: "description", value: event.target.value })}
          />
        )}
      </Field>
      <div className="flex gap-2">
        <Field label="Precio base (ARS)" error={errors.price} className="min-w-0 flex-1">
          {(props) => (
            <input
              {...props}
              type="text"
              inputMode="numeric"
              value={draft.price}
              placeholder="$0"
              onChange={(event) => onAction({ type: "set-field", field: "price", value: event.target.value })}
            />
          )}
        </Field>
        <Field label="Categoría" error={errors.categoryId} className="min-w-0 flex-1">
          {(props) => (
            <select
              {...props}
              value={draft.categoryId}
              onChange={(event) =>
                onAction({ type: "set-category", categoryId: event.target.value as ProductCategoryId })
              }
              className={clsx(props.className, "cursor-pointer")}
            >
              <option value="" disabled>
                Elegí una categoría
              </option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </section>
  );
}

type ImageUploadProps = { image?: string; name: string; error?: string; onAction: OnAction };

/**
 * "Editor Image Upload". "Reemplazar" picks a local file and shows it for this session only (no
 * upload); "Quitar" leaves the product without a photo.
 */
export function EditorImageUpload({ image, name, error, onAction }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  return (
    <section
      aria-labelledby="editor-image-title"
      className="flex w-[250px] shrink-0 flex-col gap-[7px] rounded-tile bg-surface p-[11px] outline-1 -outline-offset-[0.5px] outline-line"
    >
      <h3 id="editor-image-title" className="text-[12px] font-bold text-ink">
        Imagen principal
      </h3>
      <ProductImage
        src={image}
        alt={name || "Producto nuevo"}
        sizes="228px"
        iconSize={24}
        className={clsx("h-32 w-full rounded-field", error && "outline-1 -outline-offset-1 outline-danger")}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAction({ type: "set-image", image: URL.createObjectURL(file) });
          event.target.value = "";
        }}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-describedby={error ? errorId : undefined}
          onClick={() => inputRef.current?.click()}
          className="flex h-[30px] flex-1 items-center justify-center rounded-[7px] bg-brand text-[11px] font-bold text-white outline-1 -outline-offset-[0.5px] outline-brand hover:bg-brand/92"
        >
          Reemplazar
        </button>
        <button
          type="button"
          disabled={!image}
          onClick={() => onAction({ type: "set-image", image: undefined })}
          className="flex h-[30px] flex-1 items-center justify-center rounded-[7px] bg-surface text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line enabled:hover:bg-cream disabled:cursor-not-allowed disabled:text-muted"
        >
          Quitar
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

/** "Product Taxonomy": "Editor Category Selector" and "Editor Moment Selector" chips. */
export function ProductTaxonomy({ draft, onAction }: Omit<SectionProps, "errors">) {
  return (
    <div className="flex w-full shrink-0 gap-[9px]">
      <fieldset className="flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] bg-surface p-3 outline-1 -outline-offset-[0.5px] outline-line">
        <legend className="float-left text-[12px] font-bold text-ink">Categorías</legend>
        <div className="flex flex-wrap gap-[5px]">
          {PRODUCT_CATEGORIES.map((category) => {
            const selected = draft.categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onAction({ type: "set-category", categoryId: category.id })}
                className={clsx(
                  "flex h-6 items-center rounded-[7px] px-[7px] text-[11px] font-bold whitespace-nowrap",
                  selected ? "bg-brand text-white" : "bg-cream text-muted hover:bg-sand",
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] bg-surface p-3 outline-1 -outline-offset-[0.5px] outline-line">
        <legend className="float-left text-[12px] font-bold text-ink">Momentos de consumo</legend>
        <div className="flex flex-wrap gap-[5px]">
          {CONSUMPTION_MOMENTS.map((moment) => {
            const selected = draft.moments.includes(moment.id);
            return (
              <button
                key={moment.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onAction({ type: "toggle-moment", moment: moment.id })}
                className={clsx(
                  "flex h-6 items-center rounded-[7px] px-[7px] text-[11px] font-bold whitespace-nowrap",
                  selected ? "bg-brand-wash text-brand" : "bg-cream text-muted hover:bg-sand",
                )}
              >
                {moment.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/** "Customer Notes Setting": "Permitir observaciones del cliente" switch. */
export function CustomerNotesSetting({ allow, onAction }: { allow: boolean; onAction: OnAction }) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center justify-between rounded-[10px] bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line">
      <div className="flex flex-col gap-0.5">
        <p id="customer-notes-title" className="text-[12px] font-bold text-ink">
          Permitir observaciones del cliente
        </p>
        <p id="customer-notes-help" className="text-[11px] text-muted">
          Usá opciones estructuradas para personalizaciones que modifican el precio.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={allow}
        aria-labelledby="customer-notes-title"
        aria-describedby="customer-notes-help"
        onClick={() => onAction({ type: "set-customer-notes", allow: !allow })}
        className={clsx(
          "flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] p-[3px] transition-colors",
          allow ? "justify-end bg-brand" : "justify-start bg-line",
        )}
      >
        <span aria-hidden="true" className="size-4 rounded-full bg-surface" />
      </button>
    </div>
  );
}
