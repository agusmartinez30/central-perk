import type { VenueTable } from "@/mocks/service-day";
import type { SectorFilter } from "./table-config";

export type PrintSizeId = "a6" | "compact";

export type PrintSize = { id: PrintSizeId; label: string; perSheet: number };

/**
 * 09E "Tamaño": A6 cards (four per A4 sheet, as the 09E preview) or compact cards (six per
 * A4 sheet, the 09D "Hoja A4 · 6 tarjetas"; the "Compacta" name is invented).
 */
export const PRINT_SIZES: readonly PrintSize[] = [
  { id: "a6", label: "A6", perSheet: 4 },
  { id: "compact", label: "Compacta", perSheet: 6 },
];

export function getPrintSize(id: PrintSizeId): PrintSize {
  return PRINT_SIZES.find((size) => size.id === id) ?? PRINT_SIZES[0];
}

/** "Solo se incluyen credenciales QR activas": enabled tables with a QR, by number. */
export function getPrintableTables(tables: readonly VenueTable[]): VenueTable[] {
  return tables.filter((table) => table.enabled && table.qr).sort((a, b) => a.number - b.number);
}

export function filterBySector(tables: readonly VenueTable[], sector: SectorFilter): VenueTable[] {
  return sector === "all" ? [...tables] : tables.filter((table) => table.sector === sector);
}

/** Choosing a sector selects every printable table of it. */
export function selectSector(printable: readonly VenueTable[], sector: SectorFilter): string[] {
  return filterBySector(printable, sector).map((table) => table.id);
}

export function toggleSelection(selection: readonly string[], id: string): string[] {
  return selection.includes(id) ? selection.filter((item) => item !== id) : [...selection, id];
}

/** "✓ Seleccionar todos": selects the visible tables, or clears them when all already are. */
export function toggleAll(visible: readonly VenueTable[], selection: readonly string[]): string[] {
  if (visible.length === 0) return [...selection];
  const visibleIds = visible.map((table) => table.id);
  if (visibleIds.every((id) => selection.includes(id))) return selection.filter((id) => !visibleIds.includes(id));
  return [...selection, ...visibleIds.filter((id) => !selection.includes(id))];
}

/** Printable tables in the selection, by number; ids no longer eligible are ignored. */
export function getSelectedTables(printable: readonly VenueTable[], selection: readonly string[]): VenueTable[] {
  return printable.filter((table) => selection.includes(table.id));
}

/** Splits cards into A4 sheets. */
export function paginate<T>(items: readonly T[], perSheet: number): T[][] {
  const sheets: T[][] = [];
  for (let index = 0; index < items.length; index += perSheet) sheets.push(items.slice(index, index + perSheet));
  return sheets;
}
