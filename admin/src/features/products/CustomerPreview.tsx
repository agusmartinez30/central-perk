"use client";

import clsx from "clsx";
import { ArrowLeft, Info, LockKeyhole } from "lucide-react";
import { useState } from "react";
import type { EditorAction } from "./product-editor-state";
import {
  getProductPreviewView,
  type PreviewSummaryGroup,
  type PreviewVersion,
  type ProductPreviewView,
} from "./product-preview";
import type { ProductsState } from "./products-state";
import { CustomerProductPreview } from "./CustomerProductPreview";
import { ProductsBreadcrumb } from "./ProductEditor";
import { ProductImage } from "./ProductTags";

type CustomerPreviewProps = {
  state: ProductsState;
  onAction: (action: EditorAction) => void;
};

const VERSION_TONES: Record<PreviewVersion, { dot: string; label: string }> = {
  published: { dot: "bg-success", label: "text-ink" },
  pending: { dot: "bg-warning", label: "text-warning" },
};

/** "Preview Version Selector": "Versión publicada" / "Cambios pendientes". */
function VersionSelector({ view, onSelect }: { view: ProductPreviewView; onSelect: (version: PreviewVersion) => void }) {
  return (
    <div role="group" aria-label="Versión de la vista previa" className="flex h-9 gap-[3px] rounded-[9px] bg-sand p-[3px]">
      {view.versions.map((option) => {
        const selected = option.id === view.version;
        const tone = VERSION_TONES[option.id];
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            title={option.disabled ? (option.id === "pending" ? "Sin cambios pendientes" : "Producto sin publicar") : undefined}
            onClick={() => onSelect(option.id)}
            className={clsx(
              "flex h-full items-center gap-[5px] rounded-[7px] px-2.5 disabled:cursor-not-allowed disabled:opacity-45",
              selected ? "bg-surface" : "enabled:hover:bg-surface/60",
            )}
          >
            <span aria-hidden="true" className={clsx("size-[5px] shrink-0 rounded-full", tone.dot)} />
            <span className={clsx("text-[11px] font-bold whitespace-nowrap", tone.label)}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "Fact · …": uppercase label and value of the 2×2 "Compact Product Facts". */
function Fact({ label, value, tone = "text-ink", className }: { label: string; value: string; tone?: string; className?: string }) {
  return (
    <div className={clsx("flex min-w-0 flex-col justify-center gap-1 px-3 py-2.5", className)}>
      <dt className="text-[11px] font-bold tracking-[0.5px] text-muted">{label}</dt>
      <dd className={clsx("truncate text-[13px] font-bold", tone)}>{value}</dd>
    </div>
  );
}

/** "Summary Group · …": title, rule and one 38px row per option. */
function SummaryGroup({ group }: { group: PreviewSummaryGroup }) {
  return (
    <div role="group" aria-label={group.title} className="flex w-full flex-col gap-[7px] rounded-[9px] bg-[#faf9f6] p-3">
      <div className="flex w-full items-center justify-between gap-2">
        <p className="truncate text-[13px] font-bold text-ink">{group.title}</p>
        <p className="shrink-0 text-[11px] text-muted">{group.rule}</p>
      </div>
      <ul className="grid w-full grid-cols-3 gap-1.5">
        {group.options.map((option) => (
          <li
            key={option.id}
            className="flex h-[38px] min-w-0 flex-col items-center justify-center gap-px rounded-[7px] bg-surface px-2 outline-1 -outline-offset-[0.5px] outline-line"
          >
            <span className="max-w-full truncate text-[12px] font-bold text-ink">{option.name}</span>
            <span className={clsx("text-[11px] font-semibold", option.extraCharge ? "text-brand" : "text-muted")}>
              {option.priceLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Administrative Summary": what the admin configured for the version shown. */
function AdministrativeSummary({ view }: { view: ProductPreviewView }) {
  const { preview } = view;
  return (
    <section
      aria-label="Resumen administrativo"
      className="flex h-full w-[520px] shrink-0 flex-col gap-[15px] overflow-y-auto rounded-card bg-surface p-5 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex w-full shrink-0 items-center gap-3.5">
        <ProductImage src={preview.image} alt={preview.name} sizes="76px" iconSize={20} className="size-[76px] rounded-[12px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p
              className={clsx(
                "flex h-[22px] items-center gap-[5px] rounded-[11px] px-2",
                view.published ? "bg-success-bg text-success" : "bg-sand text-muted",
              )}
            >
              <span aria-hidden="true" className={clsx("size-[5px] rounded-full", view.published ? "bg-success" : "bg-muted")} />
              <span className="text-[11px] font-bold whitespace-nowrap">{view.publicationLabel}</span>
            </p>
            {view.skuLabel && <p className="text-[11px] whitespace-nowrap text-muted">{view.skuLabel}</p>}
          </div>
          <h3 className="truncate text-[21px] font-bold text-ink">{preview.name}</h3>
          {preview.description && <p className="text-[12px]/[15px] text-muted">{preview.description}</p>}
        </div>
      </div>
      <hr className="w-full shrink-0 border-[#e9e6df]" />
      <dl className="grid w-full shrink-0 grid-cols-2 [&>div]:border-[#e9e6df] [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(odd)]:border-r">
        <Fact label="PRECIO BASE" value={preview.price} />
        <Fact label="CATEGORÍA" value={preview.categoryLabel} />
        <Fact
          label="DISPONIBILIDAD"
          value={preview.availabilityLabel}
          tone={view.available ? "text-success" : "text-muted"}
        />
        <Fact label="MOMENTOS" value={preview.momentsLabel} />
      </dl>
      <section aria-labelledby="visible-customizations-title" className="flex w-full shrink-0 flex-col gap-2.5">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h4 id="visible-customizations-title" className="text-[14px] font-bold text-ink">
              Personalizaciones visibles
            </h4>
            <p className="text-[11px] text-muted">Configuración reflejada en la carta digital</p>
          </div>
          <p className="shrink-0 text-[11px] font-bold text-brand">{view.optionsSummary}</p>
        </div>
        {view.groups.map((group) => (
          <SummaryGroup key={group.id} group={group} />
        ))}
      </section>
      <p className="flex w-full shrink-0 items-center gap-2 rounded-[9px] bg-[#f3f5fa] p-[11px] text-muted">
        <Info size={13} aria-hidden="true" className="shrink-0" />
        <span className="text-[12px]">La vista previa es informativa y no modifica la publicación actual.</span>
      </p>
    </section>
  );
}

/**
 * 07C · Vista previa del producto ("Premium Preview Main"): the administrative summary next to
 * the customer experience, for the saved product ("Versión publicada") or the draft open in the
 * editor ("Cambios pendientes"). Read only: "Volver a editar" returns to the same draft.
 */
export function CustomerPreview({ state, onAction }: CustomerPreviewProps) {
  const [requested, setRequested] = useState<PreviewVersion | null>(null);
  const view = getProductPreviewView(state, requested);
  if (!view) return null;

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[780px] flex-col gap-3 px-7 py-[18px]">
      <header className="flex h-[68px] w-full shrink-0 items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <ProductsBreadcrumb current={view.breadcrumb} onAction={onAction} />
          <h2 className="text-[25px] font-bold whitespace-nowrap text-ink">Vista previa del producto</h2>
          <p className="text-[12px] whitespace-nowrap text-muted">
            Revisá la información administrativa y la experiencia del cliente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAction({ type: "close-preview" })}
            className="flex h-9 items-center gap-1.5 rounded-nav bg-surface px-[11px] text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">Volver a editar</span>
          </button>
          <VersionSelector view={view} onSelect={setRequested} />
        </div>
      </header>
      <div className="flex min-h-0 w-full flex-1 items-start gap-3.5">
        <AdministrativeSummary view={view} />
        <section
          aria-labelledby="customer-experience-title"
          className="flex h-full min-w-0 flex-1 flex-col items-center gap-2.5 rounded-card bg-surface px-[18px] py-3.5 outline-1 -outline-offset-[0.5px] outline-line"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 id="customer-experience-title" className="text-[14px] font-bold whitespace-nowrap text-ink">
                Experiencia del cliente
              </h3>
              <p className="text-[11px] whitespace-nowrap text-muted">Viewport móvil · Desplazamiento interno</p>
            </div>
            <p className="flex h-6 items-center gap-[5px] rounded-xl bg-sand px-2 text-muted">
              <LockKeyhole size={10} aria-hidden="true" />
              <span className="text-[11px] font-bold whitespace-nowrap">Solo lectura</span>
            </p>
          </div>
          <CustomerProductPreview
            key={view.version}
            preview={view.preview}
            available={view.available}
            variant="viewport"
            className="min-h-0 w-[370px] flex-1"
          />
        </section>
      </div>
    </div>
  );
}
