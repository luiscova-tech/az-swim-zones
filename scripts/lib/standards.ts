import { parseTime } from "./time.js";
import type { AgeGroup } from "./ageGroup.js";

export type Course = "LCM" | "SCM" | "SCY";
export type Gender = "F" | "M";

export interface StandardsEventEntry {
  key: string;
  stroke: string;
  displayName: Record<Course, string>;
  distance: Record<Course, number>;
  standards: {
    girls: Record<Course, string>;
    boys: Record<Course, string>;
  };
  /**
   * Optional AA standards. When present these drive the "is this swim close to
   * AAA?" judgement; when absent a conservative percentage fallback is used.
   * Same shape as `standards` so the AA table can be dropped in directly.
   */
  aaStandards?: {
    girls: Partial<Record<Course, string>>;
    boys: Partial<Record<Course, string>>;
  };
}

export interface StandardsAgeGroup {
  label: string;
  events: StandardsEventEntry[];
}

export interface StandardsData {
  ageGroups: Record<AgeGroup, StandardsAgeGroup>;
  wagzEventProgram: Record<AgeGroup, string[]>;
}

export interface StandardComparison {
  /** true if the swum time is at or faster than (<=) the AAA standard. */
  isAAA: boolean;
  standardSeconds: number;
  /** time - standard, in seconds. Negative/zero = met the standard. */
  gapSeconds: number;
  /** gapSeconds as a percentage of the standard. */
  gapPercent: number;
}

/** Never converts between courses — always compares a time only against its own course's standard. */
export function getStandardSeconds(
  standards: StandardsData,
  ageGroup: AgeGroup,
  eventKey: string,
  course: Course,
  gender: Gender
): number | undefined {
  const group = standards.ageGroups[ageGroup];
  const event = group?.events.find((e) => e.key === eventKey);
  if (!event) return undefined;
  const genderKey = gender === "F" ? "girls" : "boys";
  const raw = event.standards[genderKey][course];
  if (!raw) return undefined;
  const parsed = parseTime(raw);
  return parsed ?? undefined;
}

export function compareToStandard(swumSeconds: number, standardSeconds: number): StandardComparison {
  const gapSeconds = swumSeconds - standardSeconds;
  return {
    isAAA: gapSeconds <= 0,
    standardSeconds,
    gapSeconds,
    gapPercent: (gapSeconds / standardSeconds) * 100,
  };
}

/**
 * How close a swim is to the AAA cut. Drives the tone of what we tell a family,
 * because saying "so close!" to a swimmer twenty seconds off the cut is both
 * false and faintly insulting — and it devalues the message for the swimmer who
 * genuinely is a tenth away.
 */
export type ProximityTier =
  /** At or under the AAA cut. */
  | "aaa"
  /** Close enough that "so close" is honest and the cut is a realistic target. */
  | "close"
  /** A real but reachable gap. State it plainly, no false urgency. */
  | "working"
  /** A long way off. Encourage the swimmer, don't imply the cut is imminent. */
  | "developing";

/**
 * Interim threshold, used ONLY when no AA standard is available for the event.
 *
 * The correct boundary is the AA standard — a swim at or faster than AA is
 * genuinely knocking on the door of AAA, and that is the rule the site owner
 * asked for. Until the AA table is in standards.json we fall back to a
 * deliberately CONSERVATIVE percentage, so we under-claim rather than over-claim:
 * a swim just outside this reads as "working", never as "so close".
 *
 * Replace this path entirely once `aaStandards` are present — do not tune the
 * number as a substitute for real data.
 */
export const INTERIM_CLOSE_PERCENT = 2;
export const INTERIM_WORKING_PERCENT = 8;

/**
 * Classify a swim. If `aaSeconds` is supplied (the real AA standard for this
 * event/course/gender) it is authoritative: at-or-under AA means "close".
 * Otherwise we fall back to the conservative percentage bands above.
 */
export function proximityTier(
  swumSeconds: number,
  standardSeconds: number,
  aaSeconds?: number
): ProximityTier {
  if (swumSeconds <= standardSeconds) return "aaa";

  if (aaSeconds !== undefined) {
    // Real AA data available -- this is the rule we actually want.
    if (swumSeconds <= aaSeconds) return "close";
    const pastAa = ((swumSeconds - aaSeconds) / aaSeconds) * 100;
    return pastAa <= INTERIM_WORKING_PERCENT ? "working" : "developing";
  }

  const gapPercent = ((swumSeconds - standardSeconds) / standardSeconds) * 100;
  if (gapPercent <= INTERIM_CLOSE_PERCENT) return "close";
  if (gapPercent <= INTERIM_WORKING_PERCENT) return "working";
  return "developing";
}

/** The AA standard for an event, if the standards file carries one. */
export function getAaStandardSeconds(
  standards: StandardsData,
  ageGroup: AgeGroup,
  eventKey: string,
  course: Course,
  gender: Gender
): number | undefined {
  const group = standards.ageGroups[ageGroup];
  const event = group?.events.find((e) => e.key === eventKey);
  if (!event?.aaStandards) return undefined;
  const genderKey = gender === "F" ? "girls" : "boys";
  const raw = event.aaStandards[genderKey]?.[course];
  if (!raw) return undefined;
  return parseTime(raw) ?? undefined;
}

/** Convenience: look up the standard and compare a swum time in one call. */
export function evaluateTime(
  standards: StandardsData,
  ageGroup: AgeGroup,
  eventKey: string,
  course: Course,
  gender: Gender,
  swumSeconds: number
): StandardComparison | undefined {
  const standardSeconds = getStandardSeconds(standards, ageGroup, eventKey, course, gender);
  if (standardSeconds === undefined) return undefined;
  return compareToStandard(swumSeconds, standardSeconds);
}
