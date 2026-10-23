"use client";

import { ArrowLeft, BadgeDollarSign, CircleCheck, Clock3, LockKeyhole, RefreshCw, Tags, type LucideIcon } from "lucide-react";
import type { EditorAction, EditorState, EditorView } from "./product-editor-state";
import { CustomerProductPreview } from "./CustomerProductPreview";
import { ProductsBreadcrumb } from "./ProductEditor";

type CustomerPreviewProps = {
  editor: EditorState;
  view: EditorView;
  onAction: (action: EditorAction) => void;
};

/** "Preview Context · …": icon, small label and value on cream. */
function ContextRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex w-full items-center gap-[9px] rounded-field bg-cream p-[11px]">
      <Icon size={14} aria-hidden="true" className="shrink-0 text-ink" />
      <dl className="flex flex-col gap-0.5">
        <dt className="text-[11px] font-bold text-muted">{label}</dt>
        <dd className="text-[13px] font-bold text-ink">{value}</dd>
      </dl>
    </div>
  );
}

/**
 * 07C · Vista previa del producto ("Customer Preview Main"): what customers will see for the
 * draft open in the editor, next to the data it combines.
 */
export function CustomerPreview({ editor, view, onAction }: CustomerPreviewProps) {
  const { preview } = view;
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[780px] flex-col gap-3 px-7 py-[18px]">
      <header className="flex w-full shrink-0 items-end justify-between">
        <div className="flex flex-col gap-[3px]">
          <ProductsBreadcrumb current="Vista previa" onAction={onAction} />
          <h2 className="text-[24px] font-bold whitespace-nowrap text-ink">Vista previa del producto</h2>
          <p className="text-[12px] whitespace-nowrap text-muted">
            Revisá cómo verán los clientes el producto antes de publicarlo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAction({ type: "close-preview" })}
            className="flex h-8 items-center gap-1.5 rounded-nav bg-surface px-2.5 text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Volver al editor</span>
          </button>
          <p className="flex h-8 items-center gap-1.5 rounded-nav bg-sand px-2.5 text-muted">
            <LockKeyhole size={13} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Vista de solo lectura</span>
          </p>
        </div>
      </header>
      <section
        aria-label="Vista previa"
        className="flex min-h-0 w-full flex-1 items-center justify-center gap-7 rounded-[14px] bg-surface p-6 outline-1 -outline-offset-[0.5px] outline-line"
      >
        <div className="flex w-[330px] flex-col gap-3.5">
          <h3 className="text-[18px] font-bold text-ink">{view.previewTitle}</h3>
          <p className="text-[12px] text-muted">
            La vista combina los datos generales, variantes, extras y disponibilidad configurados en el editor.
          </p>
          <ContextRow icon={BadgeDollarSign} label="Precio base" value={preview.price} />
          <ContextRow icon={Tags} label="Categoría" value={preview.categoryLabel} />
          <ContextRow icon={Clock3} label="Momentos" value={preview.momentsLabel} />
          <ContextRow icon={CircleCheck} label="Disponibilidad" value={preview.availabilityLabel} />
          <p className="flex items-start gap-2 rounded-field bg-warning-bg p-2.5 text-warning">
            <RefreshCw size={13} aria-hidden="true" className="mt-px shrink-0" />
            <span className="text-[11px] font-bold">
              El servidor vuelve a validar precio y disponibilidad al confirmar el pedido.
            </span>
          </p>
        </div>
        <CustomerProductPreview preview={preview} available={editor.draft.available} className="h-[690px] w-[400px] shrink-0" />
      </section>
    </div>
  );
}
