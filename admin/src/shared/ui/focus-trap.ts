/** Elements a dialog's focus trap cycles through. */
export const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Where Tab (or Shift+Tab when `backwards`) must move focus to keep it inside a dialog with
 * `count` focusable elements, `index` being the focused one (-1 when focus is outside). Returns
 * null when the browser's own move already stays inside.
 */
export function getTrapTarget(count: number, index: number, backwards: boolean): number | null {
  if (count === 0) return null;
  const last = count - 1;
  if (index === -1) return backwards ? last : 0;
  if (backwards && index === 0) return last;
  if (!backwards && index === last) return 0;
  return null;
}
