"use client";

import clsx from "clsx";
import { LockKeyhole, Maximize2, RefreshCw } from "lucide-react";
import type { EditorAction, EditorState, EditorView } from "./product-editor-state";
import { CustomerProductPreview } from "./CustomerProductPreview";
import { OptionGroupCard } from "./OptionGroupCard";
import { CustomerNotesSetting, EditorImageUpload, GeneralInformation, ProductTaxonomy } from "./ProductEditorForm";
import { AvailabilitySwitch, PublicationStatus } from "./ProductTags";

type ProductEditorProps = {
  editor: EditorState;
  view: EditorView;
  onAction: (action: EditorAction) => void;
};

/** "Carta digital / Productos / …" with "Productos" back to the list. */
export function ProductsBreadcrumb({ current, onAction }: { current: string; onAction: (action: EditorAction) => void }) {
  return (
    <nav aria-label="Ruta" className="text-[11px] font-bold whitespace-nowrap text-brand">
      Carta digital /{" "}
      <button type="button" onClick={() => onAction({ type: "close-editor" })} className="underline-offset-2 hover:underline">
        Productos
      </button>{" "}
      / <span aria-current="page">{current}</span>
    </nav>
  );
}

const SAVE_TONES = { neutral: "text-ink", warning: "text-warning", danger: "text-danger" } as const;

/** "Editor Save Product Bar": state of the draft, "Guardar borrador" and "Publicar producto". */
function EditorSaveProductBar({ view, onAction }: Omit<ProductEditorProps, "editor">) {
  return (
    <div className="flex h-[60px] w-full shrink-0 items-center justify-between rounded-tile bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line">
      <div role="status" className="flex flex-col gap-0.5">
        <p className={clsx("text-[12px] font-bold whitespace-nowrap", SAVE_TONES[view.saveTone])}>{view.saveTitle}</p>
        <p className="text-[11px] whitespace-nowrap text-muted">{view.saveMeta}</p>
      </div>
      <div className="flex items-center gap-[7px]">
        {view.dirty && (
          <button
            type="button"
            onClick={() => onAction({ type: "discard" })}
            className="flex h-[38px] items-center rounded-nav px-[11px] text-[12px] font-bold text-muted hover:bg-cream hover:text-ink"
          >
            Descartar cambios
          </button>
        )}
        <button
          type="button"
          disabled={!view.canSaveDraft}
          onClick={() => onAction({ type: "save", mode: "draft" })}
          className="flex h-[38px] items-center rounded-nav bg-surface px-[11px] text-[12px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line enabled:hover:bg-cream disabled:cursor-not-allowed disabled:text-muted"
        >
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={!view.canPublish}
          onClick={() => onAction({ type: "save", mode: "publish" })}
          className="flex h-[38px] items-center rounded-nav bg-brand px-[11px] text-[12px] font-bold text-white outline-1 -outline-offset-[0.5px] outline-brand enabled:hover:bg-brand/92 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Publicar producto
        </button>
      </div>
    </div>
  );
}

/** "Product Preview Column": the read-only customer preview of the draft. */
function ProductPreviewColumn({ editor, view, onAction }: ProductEditorProps) {
  return (
    <aside aria-label="Vista previa del cliente" className="flex h-full w-[380px] shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-ink">Vista previa del cliente</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAction({ type: "open-preview" })}
            className="flex h-6 items-center gap-[5px] rounded-[7px] px-2 text-brand hover:bg-brand-wash"
          >
            <Maximize2 size={11} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Ampliar</span>
          </button>
          <p className="flex h-6 items-center gap-[5px] rounded-[7px] bg-sand px-2 text-muted">
            <LockKeyhole size={11} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Solo lectura</span>
          </p>
        </div>
      </div>
      <CustomerProductPreview preview={view.preview} available={editor.draft.available} className="min-h-0 w-full flex-1" />
      <p className="flex items-center gap-[7px] rounded-nav bg-warning-bg p-[9px] text-warning">
        <RefreshCw size={12} aria-hidden="true" className="shrink-0" />
        <span className="text-[11px] font-bold">La disponibilidad se revalida al confirmar el pedido.</span>
      </p>
    </aside>
  );
}

/**
 * 07B · Editar producto ("Product Editor Main"): header with the saved publication and the draft
 * availability, the form column and the live customer preview.
 */
export function ProductEditor({ editor, view, onAction }: ProductEditorProps) {
  const { draft } = editor;
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-2.5 px-7 pt-4 pb-3.5">
      <header className="flex w-full shrink-0 items-end justify-between">
        <div className="flex flex-col gap-[3px]">
          <ProductsBreadcrumb current={view.breadcrumb} onAction={onAction} />
          <h2 className="text-[23px] font-bold whitespace-nowrap text-ink">{view.title}</h2>
          <p className="text-[12px] whitespace-nowrap text-muted">
            Configurá la información, opciones y disponibilidad del producto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PublicationStatus status={view.status} label={view.statusLabel} />
          <AvailabilitySwitch
            available={draft.available}
            label="Disponibilidad del producto"
            onChange={(available) => onAction({ type: "set-draft-availability", available })}
          />
        </div>
      </header>
      <div className="flex min-h-0 w-full flex-1 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[9px]">
          <div className="flex w-full shrink-0 items-start gap-[9px]">
            <GeneralInformation draft={draft} errors={view.errors} onAction={onAction} />
            <EditorImageUpload image={draft.image} name={draft.name} error={view.errors.image} onAction={onAction} />
          </div>
          <ProductTaxonomy draft={draft} onAction={onAction} />
          <div className="flex min-h-0 w-full flex-1 gap-[9px]">
            {view.optionGroups.map((group) => (
              <OptionGroupCard
                key={group.id}
                groupId={group.id}
                title={group.title}
                meta={group.meta}
                options={group.options}
                editingOptionId={editor.editingOptionId}
                errors={view.errors.optionGroups?.[group.id]?.options}
                onAction={onAction}
              />
            ))}
          </div>
          <CustomerNotesSetting allow={draft.allowCustomerNotes} onAction={onAction} />
          <EditorSaveProductBar view={view} onAction={onAction} />
        </div>
        <ProductPreviewColumn editor={editor} view={view} onAction={onAction} />
      </div>
    </div>
  );
}
