import { formatPrice } from "@/shared/lib/format-price";
import type { PreviewGroup, PreviewModel } from "./product-form";

/**
 * What the visitor picked in the 07B phone preview, by group id. It lives in the preview only:
 * it never changes the draft.
 */
export type PreviewSelection = Readonly<Record<string, readonly string[]>>;

export const PREVIEW_QUANTITY_MAX = 20;

type PreviewOrder = Pick<PreviewModel, "basePrice" | "groups">;

/** The ids of `picked` the group still offers, trimmed to its current rules. */
function resolveGroupSelection(group: PreviewGroup, picked: readonly string[] | undefined): string[] {
  const defaults = group.options.filter((option) => option.selected).map((option) => option.id);
  if (!picked) return defaults;
  const offered = picked.filter((id) => group.options.some((option) => option.id === id));
  if (group.selection === "single") {
    const kept = offered.slice(0, 1);
    return group.required && kept.length === 0 ? defaults : kept;
  }
  return group.max ? offered.slice(0, group.max) : offered;
}

/** Choices per shown group: what the visitor touched, else the options preselected by the draft. */
export function getPreviewSelection(preview: PreviewOrder, touched: PreviewSelection): PreviewSelection {
  return Object.fromEntries(preview.groups.map((group) => [group.id, resolveGroupSelection(group, touched[group.id])]));
}

/**
 * A tap on an option: a single group switches to it (an optional one clears when tapped again,
 * a required one never empties); a multiple group toggles it unless the maximum is reached.
 * Returns the same selection when nothing changes.
 */
export function togglePreviewOption(
  preview: PreviewOrder,
  selection: PreviewSelection,
  groupId: string,
  optionId: string,
): PreviewSelection {
  const group = preview.groups.find((candidate) => candidate.id === groupId);
  if (!group || !group.options.some((option) => option.id === optionId)) return selection;
  const current = selection[groupId] ?? [];
  const isSelected = current.includes(optionId);
  let next: string[];
  if (group.selection === "single") {
    if (isSelected && group.required) return selection;
    next = isSelected ? [] : [optionId];
  } else if (isSelected) {
    next = current.filter((id) => id !== optionId);
  } else {
    if (group.max && current.length >= group.max) return selection;
    next = [...current, optionId];
  }
  return { ...selection, [groupId]: next };
}

/** "−" / "+" of the quantity stepper, kept between 1 and `PREVIEW_QUANTITY_MAX`. */
export function stepPreviewQuantity(quantity: number, step: 1 | -1): number {
  return Math.min(PREVIEW_QUANTITY_MAX, Math.max(1, quantity + step));
}

/** (base price + selected adjustments) × quantity, in whole pesos. */
export function getPreviewTotal(preview: PreviewOrder, selection: PreviewSelection, quantity: number): number {
  const adjustments = preview.groups.reduce((total, group) => {
    const picked = selection[group.id] ?? [];
    return (
      total +
      group.options.reduce((sum, option) => sum + (picked.includes(option.id) ? option.priceDelta : 0), 0)
    );
  }, 0);
  return (preview.basePrice + adjustments) * quantity;
}

/** "Agregar · $5.400". */
export function getPreviewAddLabel(preview: PreviewOrder, selection: PreviewSelection, quantity: number): string {
  return `Agregar · ${formatPrice(getPreviewTotal(preview, selection, quantity))}`;
}
