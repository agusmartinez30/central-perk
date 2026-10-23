import type { ConsumptionMomentId, Product, ProductCategoryId, ProductOption } from "@/mocks/service-day";
import { formatPrice } from "@/shared/lib/format-price";
import { CONSUMPTION_MOMENTS } from "@/mocks/service-day";
import { getCategoryLabel, normalizeText } from "./product-catalog";

/** An option row while it is edited: the adjustment stays the typed text. */
export type OptionDraft = { id: string; name: string; priceDelta: string };

/** Fields of the 07B editor, as typed. */
export type ProductDraft = {
  name: string;
  description: string;
  /** "Precio base (ARS)" as typed, e.g. "$4.600". */
  price: string;
  categoryId: ProductCategoryId | "";
  moments: ConsumptionMomentId[];
  image?: string;
  available: boolean;
  allowCustomerNotes: boolean;
  sizes: OptionDraft[];
  defaultSizeId?: string;
  extras: OptionDraft[];
};

export type OptionGroupId = "sizes" | "extras";

/** "Guardar borrador" or "Publicar producto". */
export type SaveMode = "draft" | "publish";

/** "Selección múltiple · Opcional · Máx. 3". */
export const EXTRAS_MAX_SELECTION = 3;

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 140;
export const PRICE_MAX = 1_000_000;

/** Whole pesos, plain ("4600") or grouped with dots ("$4.600"). */
const PRICE_PATTERN = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/;

/** Reads a typed amount in whole pesos; null when it is empty, negative, decimal or malformed. */
export function parsePriceInput(value: string): number | null {
  const compact = value.replace(/\s+/g, "").replace(/^\$/, "");
  if (!PRICE_PATTERN.test(compact)) return null;
  return Number(compact.replace(/\./g, ""));
}

/** "+$800", as the 07B option rows. */
export function formatOptionDelta(amount: number): string {
  return `+${formatPrice(amount)}`;
}

function toOptionDraft(option: ProductOption): OptionDraft {
  return { id: option.id, name: option.name, priceDelta: String(option.priceDelta) };
}

export function toProductDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    price: formatPrice(product.price),
    categoryId: product.categoryId,
    moments: [...product.moments],
    image: product.image,
    available: product.available,
    allowCustomerNotes: product.allowCustomerNotes,
    sizes: product.sizes.map(toOptionDraft),
    defaultSizeId: product.defaultSizeId,
    extras: product.extras.map(toOptionDraft),
  };
}

/** "Nuevo producto": empty, available and accepting customer notes. */
export function createEmptyDraft(): ProductDraft {
  return {
    name: "",
    description: "",
    price: "",
    categoryId: "",
    moments: [],
    image: undefined,
    available: true,
    allowCustomerNotes: true,
    sizes: [],
    defaultSizeId: undefined,
    extras: [],
  };
}

function toOption(option: OptionDraft): ProductOption {
  return { id: option.id, name: option.name.trim(), priceDelta: parsePriceInput(option.priceDelta) ?? 0 };
}

/** The size preselected for customers: the chosen one, else the first size, else none. */
function resolveDefaultSize(draft: ProductDraft): string | undefined {
  if (draft.sizes.length === 0) return undefined;
  return draft.sizes.some((size) => size.id === draft.defaultSizeId) ? draft.defaultSizeId : draft.sizes[0].id;
}

/**
 * The product saved from a valid draft. `base` gives the id and the archived flag; the save mode
 * sets the publication. The plural name only survives while the name is unchanged.
 */
export function applyProductDraft(draft: ProductDraft, base: Product, mode: SaveMode): Product {
  const name = draft.name.trim();
  return {
    ...base,
    name,
    plural: name === base.name ? base.plural : undefined,
    price: parsePriceInput(draft.price) ?? base.price,
    categoryId: draft.categoryId || base.categoryId,
    description: draft.description.trim(),
    image: draft.image,
    moments: [...draft.moments],
    publication: mode === "publish" ? "published" : "draft",
    available: draft.available,
    allowCustomerNotes: draft.allowCustomerNotes,
    sizes: draft.sizes.map(toOption),
    defaultSizeId: resolveDefaultSize(draft),
    extras: draft.extras.map(toOption),
  };
}

export type ProductField = "name" | "description" | "price" | "categoryId" | "image";

/** Field messages plus option messages by option id. Empty when the draft can be saved. */
export type ProductFormErrors = Partial<Record<ProductField, string>> & { options?: Record<string, string> };

export type ValidationContext = {
  mode: SaveMode;
  /** Names of the other products that are not archived, to keep names unique. */
  otherNames: readonly string[];
};

function validateOptions(options: readonly OptionDraft[], errors: Record<string, string>): void {
  const seen = new Set<string>();
  for (const option of options) {
    const name = normalizeText(option.name);
    if (!name) errors[option.id] = "Ingresá el nombre de la opción.";
    else if (seen.has(name)) errors[option.id] = "La opción ya existe en el grupo.";
    else if (parsePriceInput(option.priceDelta) === null) errors[option.id] = "Ingresá un ajuste válido.";
    seen.add(name);
  }
}

/**
 * Checks the draft before saving. A draft only needs a name, a price, a category and valid
 * options; publishing also asks for a description and an image.
 */
export function validateProductDraft(draft: ProductDraft, context: ValidationContext): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Ingresá el nombre del producto.";
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Usá hasta ${NAME_MAX_LENGTH} caracteres.`;
  else if (context.otherNames.some((other) => normalizeText(other) === normalizeText(name))) {
    errors.name = "Ya existe un producto con ese nombre.";
  }

  const description = draft.description.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Usá hasta ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  } else if (!description && context.mode === "publish") {
    errors.description = "Ingresá una descripción para publicar.";
  }

  const price = parsePriceInput(draft.price);
  if (price === null || price <= 0) errors.price = "Ingresá un precio válido.";
  else if (price > PRICE_MAX) errors.price = `El precio máximo es ${formatPrice(PRICE_MAX)}.`;

  if (!draft.categoryId) errors.categoryId = "Elegí una categoría.";
  if (!draft.image && context.mode === "publish") errors.image = "Agregá una imagen para publicar.";

  const options: Record<string, string> = {};
  validateOptions(draft.sizes, options);
  validateOptions(draft.extras, options);
  if (Object.keys(options).length > 0) errors.options = options;
  return errors;
}

export function hasFormErrors(errors: ProductFormErrors): boolean {
  const { options, ...fields } = errors;
  return Object.keys(fields).length > 0 || Object.keys(options ?? {}).length > 0;
}

function sameOptions(a: readonly OptionDraft[], b: readonly OptionDraft[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (option, index) =>
        option.name.trim() === b[index].name.trim() &&
        parsePriceInput(option.priceDelta) === parsePriceInput(b[index].priceDelta),
    )
  );
}

/** Same amount, or the same text when neither is a valid amount. */
function samePrice(a: string, b: string): boolean {
  const left = parsePriceInput(a);
  const right = parsePriceInput(b);
  return left === null && right === null ? a.trim() === b.trim() : left === right;
}

function sameMoments(a: readonly ConsumptionMomentId[], b: readonly ConsumptionMomentId[]): boolean {
  return a.length === b.length && a.every((moment) => b.includes(moment));
}

/** Labels of the fields that differ from the saved product, in form order. */
export function getProductChanges(saved: ProductDraft, draft: ProductDraft): string[] {
  const checks: [string, boolean][] = [
    ["Nombre del producto", saved.name.trim() !== draft.name.trim()],
    ["Descripción", saved.description.trim() !== draft.description.trim()],
    ["Precio base", !samePrice(saved.price, draft.price)],
    ["Categoría", saved.categoryId !== draft.categoryId],
    ["Momentos de consumo", !sameMoments(saved.moments, draft.moments)],
    ["Imagen principal", saved.image !== draft.image],
    ["Tamaño", !sameOptions(saved.sizes, draft.sizes) || resolveDefaultSize(saved) !== resolveDefaultSize(draft)],
    ["Extras", !sameOptions(saved.extras, draft.extras)],
    ["Observaciones del cliente", saved.allowCustomerNotes !== draft.allowCustomerNotes],
    ["Disponibilidad", saved.available !== draft.available],
  ];
  return checks.filter(([, changed]) => changed).map(([label]) => label);
}

/** "Desayunar · Merendar · Tomar", in the 07B chip order. */
export function getMomentsLabel(moments: readonly ConsumptionMomentId[]): string {
  const labels = CONSUMPTION_MOMENTS.filter((moment) => moments.includes(moment.id)).map((moment) => moment.label);
  return labels.length > 0 ? labels.join(" · ") : "Sin momentos";
}

export type PreviewModel = {
  name: string;
  description: string;
  image?: string;
  price: string;
  sizes: { id: string; name: string; selected: boolean }[];
  extras: { id: string; label: string }[];
  /** "Agregar · $5.400": base price plus the preselected size. */
  addLabel: string;
  categoryLabel: string;
  momentsLabel: string;
  availabilityLabel: string;
};

/** What the customer would see for this draft (07B "Live Product Preview", 07C). */
export function getPreviewModel(draft: ProductDraft): PreviewModel {
  const price = parsePriceInput(draft.price) ?? 0;
  const sizes = draft.sizes.filter((size) => size.name.trim());
  const defaultSizeId = resolveDefaultSize({ ...draft, sizes });
  const selectedSize = sizes.find((size) => size.id === defaultSizeId);
  const total = price + (selectedSize ? (parsePriceInput(selectedSize.priceDelta) ?? 0) : 0);
  return {
    name: draft.name.trim() || "Nuevo producto",
    description: draft.description.trim(),
    image: draft.image,
    price: formatPrice(price),
    sizes: sizes.map((size) => ({ id: size.id, name: size.name.trim(), selected: size.id === defaultSizeId })),
    extras: draft.extras
      .filter((extra) => extra.name.trim())
      .map((extra) => ({
        id: extra.id,
        label: `${extra.name.trim()} · ${formatOptionDelta(parsePriceInput(extra.priceDelta) ?? 0)}`,
      })),
    addLabel: `Agregar · ${formatPrice(total)}`,
    categoryLabel: getCategoryLabel(draft.categoryId) ?? "Sin categoría",
    momentsLabel: getMomentsLabel(draft.moments),
    availabilityLabel: draft.available ? "Disponible" : "No disponible",
  };
}
