/**
 * Reads a forced screen variant (`?state=error`) safely: only values from `allowed` are
 * accepted, case-insensitively; anything else means "no forced variant".
 */
export function parseScreenState<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return allowed.find((state) => state === normalized) ?? null;
}
