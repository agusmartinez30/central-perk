/** Local "HH:MM" helpers for the service-day mock (same day, no time zones). */

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Whole minutes from `from` to `to`, e.g. "12:42" → "13:00" is 18. */
export function minutesBetween(from: string, to: string): number {
  return toMinutes(to) - toMinutes(from);
}

/** "HH:MM" `minutes` later (or earlier when negative). */
export function addMinutes(time: string, minutes: number): string {
  const total = (((toMinutes(time) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
