import { formatClockTime } from "./delay";

const pad = (value: number) => String(value).padStart(2, "0");

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "hoy, 10:32", "ayer, 09:05" or "03/09, 18:40" (day/month) for an ISO timestamp, relative to
 * `now` in local time.
 */
export function formatRelativeDayTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const time = formatClockTime(date);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return `hoy, ${time}`;
  if (days === 1) return `ayer, ${time}`;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}, ${time}`;
}
