/** Anything shown in a user-defined display order ("Orden 1", "01"). */
export type Ordered = { id: string; order: number };

/** Copy of `items` sorted by `order` (stable for equal orders). */
export function sortByOrder<T extends Ordered>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** `items` sorted by order and renumbered 1, 2, 3… without gaps. */
export function renumber<T extends Ordered>(items: readonly T[]): T[] {
  return sortByOrder(items).map((item, index) => (item.order === index + 1 ? item : { ...item, order: index + 1 }));
}

/**
 * Moves the item with `id` to position `toIndex` (0-based, clamped) and renumbers every item.
 * Unknown ids leave the order as it was (renumbered).
 */
export function moveToIndex<T extends Ordered>(items: readonly T[], id: string, toIndex: number): T[] {
  const sorted = sortByOrder(items);
  const from = sorted.findIndex((item) => item.id === id);
  if (from === -1) return renumber(sorted);
  const [moved] = sorted.splice(from, 1);
  const target = Math.min(Math.max(toIndex, 0), sorted.length);
  sorted.splice(target, 0, moved);
  return sorted.map((item, index) => (item.order === index + 1 ? item : { ...item, order: index + 1 }));
}

/** Moves the item `step` positions up (negative) or down (positive), stopping at the edges. */
export function moveByStep<T extends Ordered>(items: readonly T[], id: string, step: number): T[] {
  const from = sortByOrder(items).findIndex((item) => item.id === id);
  if (from === -1) return renumber(items);
  return moveToIndex(items, id, from + step);
}

/** Order for an item appended after the last one. */
export function nextOrder(items: readonly Ordered[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), 0) + 1;
}

/** 08C "Orden" column: "01", "12". */
export function formatOrderNumber(order: number): string {
  return String(order).padStart(2, "0");
}
