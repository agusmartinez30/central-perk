/**
 * Formats an integer ARS amount as shown in the designs: `$19.900`.
 *
 * Grouping is done manually instead of with `Intl.NumberFormat("es-AR")`, because
 * Spanish CLDR data skips the separator for 4-digit numbers (`4500`) and the
 * currency style inserts a non-breaking space after the symbol.
 */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}$${digits}`;
}
