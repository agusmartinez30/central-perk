import type { Ars, OptionChoice, OptionGroup, Product } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

/** Selected choice ids per option group id. */
export type OptionSelection = Record<string, string[]>;

/** Default selection: each group's preselected choice; optional groups start empty. */
export function initSelection(product: Product): OptionSelection {
  return Object.fromEntries(
    (product.optionGroups ?? []).map((group) => [
      group.id,
      group.defaultChoiceId ? [group.defaultChoiceId] : [],
    ]),
  );
}

/**
 * Single-selection groups replace their choice (choosing it again keeps it, like a radio);
 * multiple-selection groups toggle it. Ids outside the group are ignored.
 */
export function toggleChoice(
  selection: OptionSelection,
  group: OptionGroup,
  choiceId: string,
): OptionSelection {
  if (!group.choices.some((choice) => choice.id === choiceId)) return selection;
  if (group.selection === "single") return { ...selection, [group.id]: [choiceId] };

  const current = selection[group.id] ?? [];
  const next = current.includes(choiceId)
    ? current.filter((id) => id !== choiceId)
    : [...current, choiceId];
  // Keep the menu order so summaries read the same regardless of tap order.
  const ordered = group.choices.map((choice) => choice.id).filter((id) => next.includes(id));
  return { ...selection, [group.id]: ordered };
}

export function getSelectedChoiceIds(product: Product, selection: OptionSelection): string[] {
  return (product.optionGroups ?? []).flatMap((group) => selection[group.id] ?? []);
}

/** Ids of required groups that still have no selection. */
export function getMissingRequiredGroups(product: Product, selection: OptionSelection): string[] {
  return (product.optionGroups ?? [])
    .filter((group) => group.required && (selection[group.id] ?? []).length === 0)
    .map((group) => group.id);
}

/** Price label next to a choice: the resulting price, or "+$900" / "Incluida". */
export function formatChoicePrice(product: Product, group: OptionGroup, choice: OptionChoice): string {
  if (group.priceDisplay === "absolute") return formatPrice(product.price + choice.priceDelta);
  if (choice.priceDelta === 0) return "Incluida";
  return choice.priceDelta > 0 ? `+${formatPrice(choice.priceDelta)}` : formatPrice(choice.priceDelta);
}

/** Lowest possible price (cheapest choice of every required group) and whether it can vary. */
export function getFromPrice(product: Product): { amount: Ars; varies: boolean } {
  const required = (product.optionGroups ?? []).filter((group) => group.required);
  const amount = required.reduce(
    (sum, group) => sum + Math.min(...group.choices.map((choice) => choice.priceDelta)),
    product.price,
  );
  const varies = required.some(
    (group) => new Set(group.choices.map((choice) => choice.priceDelta)).size > 1,
  );
  return { amount, varies };
}
