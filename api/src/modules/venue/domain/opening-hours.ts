/** Weekly opening hours in the venue's local time, and the "open now" status derived from them. */

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** One opening range per open day; days without an entry are closed. Times are "HH:MM" (24 h). */
export interface OpeningHours {
  weekday: Weekday;
  opensAt: string;
  /** Must be after `opensAt`; ranges past midnight are not supported. */
  closesAt: string;
}

export type OpenStatus = { open: true; closesAt: string } | { open: false; reopensOn: Weekday; reopensAt: string };

export type OpeningHoursIssue = { path: string; code: 'invalid_time' | 'closes_before_opens' | 'duplicate' };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function openingHoursIssues(hours: readonly OpeningHours[]): OpeningHoursIssue[] {
  const issues: OpeningHoursIssue[] = [];
  const seen = new Set<Weekday>();
  hours.forEach((range, index) => {
    if (seen.has(range.weekday)) issues.push({ path: `openingHours.${index}.weekday`, code: 'duplicate' });
    seen.add(range.weekday);
    if (!TIME.test(range.opensAt) || !TIME.test(range.closesAt)) issues.push({ path: `openingHours.${index}`, code: 'invalid_time' });
    else if (minutesOf(range.closesAt) <= minutesOf(range.opensAt))
      issues.push({ path: `openingHours.${index}`, code: 'closes_before_opens' });
  });
  return issues;
}

export function sortOpeningHours(hours: readonly OpeningHours[]): OpeningHours[] {
  return [...hours].sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday));
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Weekday and minutes since midnight of `at` in `timeZone`. */
function localClock(at: Date, timeZone: string): { weekday: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return {
    weekday: part('weekday').toLowerCase() as Weekday,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
}

/** Whether the venue is open at `at`, and otherwise when it opens next; `null` without hours. */
export function openStatusAt(hours: readonly OpeningHours[], timeZone: string, at: Date): OpenStatus | null {
  if (hours.length === 0) return null;
  const { weekday, minutes } = localClock(at, timeZone);
  const byDay = new Map(hours.map((range) => [range.weekday, range]));

  const today = byDay.get(weekday);
  if (today && minutesOf(today.opensAt) <= minutes && minutes < minutesOf(today.closesAt)) {
    return { open: true, closesAt: today.closesAt };
  }

  const start = WEEKDAYS.indexOf(weekday);
  // Offset 7 is the same weekday next week, for a venue open one day a week.
  for (let offset = 0; offset <= WEEKDAYS.length; offset += 1) {
    const day = WEEKDAYS[(start + offset) % WEEKDAYS.length]!;
    const range = byDay.get(day);
    if (range && (offset > 0 || minutes < minutesOf(range.opensAt))) {
      return { open: false, reopensOn: day, reopensAt: range.opensAt };
    }
  }
  return null;
}
