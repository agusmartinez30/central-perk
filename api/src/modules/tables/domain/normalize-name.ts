/** Comparable form of a name: no accents, trimmed, lower case and single spaces ("  Salón " → "salon"). */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
