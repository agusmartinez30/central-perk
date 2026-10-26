import type { OptionSelection } from "@/mocks/service-day";
import { getProductChanges, getPreviewModel, type PreviewGroup, type PreviewModel } from "./product-form";
import type { ProductsState } from "./products-state";

/** 07C "Preview Version Selector": the saved product or the draft open in the editor. */
export type PreviewVersion = "published" | "pending";

export type PreviewVersionOption = { id: PreviewVersion; label: string; disabled: boolean };

/** One option row of "Personalizaciones visibles". */
export type PreviewSummaryOption = {
  id: string;
  name: string;
  /** "Incluido", "Sin cargo", "+$800". */
  priceLabel: string;
  /** Adds to the price: the label is highlighted. */
  extraCharge: boolean;
};

/** One group block of "Personalizaciones visibles". */
export type PreviewSummaryGroup = {
  id: string;
  title: string;
  /** "Obligatorio · Selección única", "Opcional · Máximo 2". */
  rule: string;
  options: PreviewSummaryOption[];
};

/** 07C · Vista previa del producto, for the version shown. */
export type ProductPreviewView = {
  /** The version shown: the requested one unless it is unavailable. */
  version: PreviewVersion;
  versions: PreviewVersionOption[];
  /** Last breadcrumb segment: the saved name, or "Nuevo producto". */
  breadcrumb: string;
  /** "SKU CAF-014"; null for a product that was never saved. */
  skuLabel: string | null;
  published: boolean;
  /** "Publicado" / "No publicado". */
  publicationLabel: string;
  available: boolean;
  /** "2 grupos · 6 opciones". */
  optionsSummary: string;
  groups: PreviewSummaryGroup[];
  preview: PreviewModel;
};

type GroupRules = { selection: OptionSelection; required: boolean; max?: number };

/** 07C group rule: the requirement first, then the selection or the limit of a multiple group. */
export function getOptionGroupRule(group: GroupRules): string {
  const requirement = group.required ? "Obligatorio" : "Opcional";
  if (group.selection === "single") return `${requirement} · Selección única`;
  return `${requirement} · ${group.max ? `Máximo ${group.max}` : "Selección múltiple"}`;
}

function toSummaryGroup(group: PreviewGroup): PreviewSummaryGroup {
  return {
    id: group.id,
    title: group.title,
    rule: getOptionGroupRule(group),
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      priceLabel: option.priceLabel,
      extraCharge: option.priceDelta > 0,
    })),
  };
}

/**
 * The 07C view of the product open in the editor. "Versión publicada" is the product as last
 * saved and "Cambios pendientes" the current draft. Without changes only the saved version is
 * offered, and a product that was never saved only has its draft. `requested` null picks the
 * draft when it differs from the saved product.
 */
export function getProductPreviewView(state: ProductsState, requested: PreviewVersion | null): ProductPreviewView | null {
  const { editor } = state;
  if (!editor) return null;
  const product = state.products.find((candidate) => candidate.id === editor.productId);
  const dirty = getProductChanges(editor.saved, editor.draft).length > 0;
  const versions: PreviewVersionOption[] = [
    { id: "published", label: "Versión publicada", disabled: !product },
    { id: "pending", label: "Cambios pendientes", disabled: Boolean(product) && !dirty },
  ];
  const wanted = requested ?? (dirty || !product ? "pending" : "published");
  const version = versions.find((option) => option.id === wanted)?.disabled
    ? (versions.find((option) => !option.disabled)?.id ?? "pending")
    : wanted;
  const shown = version === "published" ? editor.saved : editor.draft;
  const preview = getPreviewModel(shown);
  return {
    version,
    versions,
    breadcrumb: product?.name ?? "Nuevo producto",
    skuLabel: product ? `SKU ${product.sku}` : null,
    published: shown.published,
    publicationLabel: shown.published ? "Publicado" : "No publicado",
    available: shown.available,
    optionsSummary: preview.optionsSummary,
    groups: preview.groups.map(toSummaryGroup),
    preview,
  };
}
