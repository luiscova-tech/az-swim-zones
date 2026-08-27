/**
 * Shared date math. Everything here works on UTC calendar dates (no time-of-day,
 * no local-timezone drift) parsed from plain "YYYY-MM-DD" strings — that's all
 * meet dates and config dates ever need.
 */

/** Parse a "YYYY-MM-DD" string into a UTC Date at midnight. */
export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    throw new Error(`Invalid ISO date: "${iso}" (expected YYYY-MM-DD)`);
  }
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  // Guard against JS rolling over an invalid day (e.g. 2026-02-30 -> 2026-03-02).
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    throw new Error(`Invalid calendar date: "${iso}"`);
  }
  return date;
}

/** Format a UTC Date back to "YYYY-MM-DD". */
export function toISODate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Subtract whole years from a UTC date, calendar-correct (not a 365-day
 * approximation). Feb 29 on a birth date rolls to Mar 1 in a non-leap target
 * year, matching JS's native Date behavior — an accepted simplification for
 * this project's purposes.
 */
export function subtractYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  result.setUTCFullYear(result.getUTCFullYear() - years);
  return result;
}

/**
 * Age (in whole/floored years) of someone born on `dob`, as of `asOf`.
 * This is the standard "have they had their birthday yet this year" calc,
 * and it's also the function we invert to turn a candidate DOB bound back
 * into a hypothetical age at the target meet.
 */
export function ageAt(dob: Date, asOf: Date): number {
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const asOfMonthDay = asOf.getUTCMonth() * 100 + asOf.getUTCDate();
  const dobMonthDay = dob.getUTCMonth() * 100 + dob.getUTCDate();
  if (asOfMonthDay < dobMonthDay) {
    age -= 1;
  }
  return age;
}

/** First day of the month containing `date`. */
export function firstDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Last day of the month containing `date`. Day 0 of the *next* month is the
 * last day of this one, which handles February and leap years for free.
 */
export function lastDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** Parse a "YYYY-MM" month string into its first day, as a UTC Date. */
export function parseISOMonth(iso: string): Date {
  if (!/^\d{4}-\d{2}$/.test(iso.trim())) {
    throw new Error(`Invalid ISO month: "${iso}" (expected YYYY-MM)`);
  }
  return parseISODate(`${iso.trim()}-01`);
}

/** true if a is strictly before b (UTC calendar-date comparison). */
export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

/** true if a is strictly after b. */
export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}
