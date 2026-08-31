/**
 * Minimal date helpers. No date library dependency is required for v1, and
 * avoiding one keeps the demo self-contained. All seed data is generated
 * relative to "now" (see src/data/seed.ts) so the prototype always looks
 * live/current rather than stuck on a fixed demo date.
 *
 * Business timezone: America/Halifax (07_DATA_MODEL.md business record).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function now(): Date {
  return new Date();
}

export function hoursAgo(hours: number, from: Date = now()): Date {
  return new Date(from.getTime() - hours * HOUR_MS);
}

export function hoursFromNow(hours: number, from: Date = now()): Date {
  return new Date(from.getTime() + hours * HOUR_MS);
}

export function daysAgo(days: number, from: Date = now()): Date {
  return new Date(from.getTime() - days * DAY_MS);
}

export function daysFromNow(days: number, from: Date = now()): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Add N business days (Mon-Fri), skipping weekends. */
export function businessDaysFromNow(days: number, from: Date = now()): Date {
  const d = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    d.setTime(d.getTime() + DAY_MS);
    if (!isWeekend(d)) remaining -= 1;
  }
  return d;
}

/** Set the wall-clock time on today's date (local time). */
export function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function toISO(date: Date): string {
  return date.toISOString();
}

export function isPast(iso: string, reference: Date = now()): boolean {
  return new Date(iso).getTime() < reference.getTime();
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (60 * 1000);
}
