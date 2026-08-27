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
