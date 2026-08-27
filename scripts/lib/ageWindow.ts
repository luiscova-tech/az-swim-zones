import {
  ageAt,
  firstDayOfMonth,
  isAfter,
  isBefore,
  lastDayOfMonth,
  parseISODate,
  parseISOMonth,
  subtractYears,
  toISODate,
} from "./date-utils.js";
import { ageGroupForAge, type AgeGroup } from "./ageGroup.js";

/**
 * One published result: a swimmer's age *at that meet* (never their DOB —
 * public results don't publish birthdates, and we never collect them).
 *
 * Sources vary in precision, and that difference matters a great deal:
 *  - Some publish an exact integer age per result (ideal: a 1-year DOB window).
 *  - Some publish only the age GROUP the swim was contested in, e.g. "11-12"
 *    (weaker: a 2-year window, since the swimmer could be either age).
 * We model both rather than forcing callers to fake an exact age they don't
 * have — inventing a precise age from an age group would silently produce
 * confident, wrong age-group assignments, the worst failure mode this site has.
 */
export interface ExactAgeObservation {
  meetDate: string; // "YYYY-MM-DD"
  ageAtMeet: number;
}

export interface AgeRangeObservation {
  meetDate: string; // "YYYY-MM-DD"
  minAgeAtMeet: number;
  maxAgeAtMeet: number;
}

export type AgeObservation = ExactAgeObservation | AgeRangeObservation;

export function isExactObservation(obs: AgeObservation): obs is ExactAgeObservation {
  return "ageAtMeet" in obs;
}

/** Normalizes either observation shape to an inclusive [min, max] age range. */
function ageRangeOf(obs: AgeObservation): { minAge: number; maxAge: number } {
  if (isExactObservation(obs)) {
    return { minAge: obs.ageAtMeet, maxAge: obs.ageAtMeet };
  }
  if (obs.minAgeAtMeet > obs.maxAgeAtMeet) {
    throw new Error(
      `Invalid age range observation: minAgeAtMeet (${obs.minAgeAtMeet}) > maxAgeAtMeet (${obs.maxAgeAtMeet})`
    );
  }
  return { minAge: obs.minAgeAtMeet, maxAge: obs.maxAgeAtMeet };
}

export interface DobWindow {
  /** Exclusive lower bound: DOB is strictly after this date. */
  lo: Date;
  /** Inclusive upper bound: DOB is on or before this date. */
  hi: Date;
}

/**
 * A single observation constrains DOB to:
 *   DOB ∈ ( meetDate − (maxAge+1) years , meetDate − minAge years ]
 *
 * For an exact age a (minAge === maxAge === a) this is the familiar
 *   DOB ∈ ( meetDate − (a+1) years , meetDate − a years ]
 * (Born any later than the upper bound and they'd have been younger at the
 * meet; any earlier than the lower bound and they'd have been older.)
 *
 * For an age-group observation like "11-12", minAge=11 and maxAge=12 widens
 * this to a 2-year window — correctly reflecting that we know less.
 */
export function windowFromObservation(obs: AgeObservation): DobWindow {
  const meetDate = parseISODate(obs.meetDate);
  const { minAge, maxAge } = ageRangeOf(obs);
  return {
    lo: subtractYears(meetDate, maxAge + 1),
    hi: subtractYears(meetDate, minAge),
  };
}

/**
 * Intersect every observation's window into the single tightest window that
 * satisfies all of them: lo = latest of the lower bounds, hi = earliest of
 * the upper bounds. More observations => a tighter (or equal) window, never
 * looser — which is what lets the window improve monotonically over time.
 *
 * If the intersection is empty (lo >= hi), the observations disagree — data
 * noise (e.g. a mis-scraped age). We fall back to the single most recent
 * observation's window rather than produce a nonsensical result, and flag it.
 */
export function intersectWindows(observations: AgeObservation[]): DobWindow & { inconsistent: boolean } {
  if (observations.length === 0) {
    throw new Error("Cannot intersect an empty set of observations");
  }

  const windows = observations.map(windowFromObservation);
  let lo = windows[0]!.lo;
  let hi = windows[0]!.hi;
  for (const w of windows.slice(1)) {
    if (isAfter(w.lo, lo)) lo = w.lo;
    if (isBefore(w.hi, hi)) hi = w.hi;
  }

  if (!isBefore(lo, hi) && lo.getTime() !== hi.getTime()) {
    // lo >= hi and they aren't the single-point case (lo == hi is fine, e.g.
    // one observation intersected with itself would never hit this, but a
    // degenerate two-observation case could). Fall back to the most recent
    // observation alone.
    const mostRecent = [...observations].sort((a, b) => (a.meetDate < b.meetDate ? 1 : -1))[0]!;
    const fallback = windowFromObservation(mostRecent);
    return { ...fallback, inconsistent: true };
  }

  return { lo, hi, inconsistent: false };
}

export interface AgeGroupResolution {
  /** true if every observation-consistent hypothesis lands on the same age. */
  certain: boolean;
  /** WAGZ age to use for display/grouping — the younger hypothesis when ambiguous. */
  wagzAge: number | null;
  ageGroup: AgeGroup | null;
  /** Ambiguous means the window straddles an age transition — never silently guessed away. */
  ageUncertain: boolean;
  eligible: boolean;
  ineligibleReason: "age-15-plus" | null;
  /** Coarse window, for internal persistence only — never render this publicly. */
  window: DobWindow;
  windowInconsistent: boolean;
}

/**
 * Resolve a swimmer's WAGZ age group from their accumulated age observations
 * and the target meet's first day of competition (W).
 *
 *   ageIfDobIsLo = floor(yearsBetween(lo, W))   // older hypothesis
 *   ageIfDobIsHi = floor(yearsBetween(hi, W))   // younger hypothesis
 *   certain  <=>  ageIfDobIsLo === ageIfDobIsHi
 *
 * Ambiguous cases default to the younger hypothesis with ageUncertain: true —
 * including at the 14/15 boundary, so a swimmer who *might* be eligible stays
 * visible (flagged) rather than being silently dropped. Only a window that is
 * 15+ under BOTH hypotheses is excluded.
 */
export function resolveAgeGroup(observations: AgeObservation[], meetFirstDay: string): AgeGroupResolution {
  if (observations.length === 0) {
    throw new Error("Cannot resolve an age group with zero observations");
  }

  const { inconsistent, ...window } = intersectWindows(observations);
  const W = parseISODate(meetFirstDay);

  const ageIfDobIsLo = ageAt(window.lo, W); // earliest possible DOB -> oldest hypothesis
  const ageIfDobIsHi = ageAt(window.hi, W); // latest possible DOB -> youngest hypothesis

  const certain = ageIfDobIsLo === ageIfDobIsHi;
  const youngerAge = Math.min(ageIfDobIsLo, ageIfDobIsHi);

  const eligible = youngerAge < 15;
  const wagzAge = eligible ? youngerAge : null;
  const ageGroup = eligible ? ageGroupForAge(youngerAge) : null;

  return {
    certain,
    wagzAge,
    ageGroup,
    ageUncertain: !certain,
    eligible,
    ineligibleReason: eligible ? null : "age-15-plus",
    window,
    windowInconsistent: inconsistent,
  };
}

export interface CoarseWindow {
  loMonth: string; // "YYYY-MM"
  hiMonth: string; // "YYYY-MM"
}

/**
 * Coarse (month-granularity) serialization for the internal, non-public
 * persistence file. This is deliberately LOSSY: the loss of day-level
 * precision IS the privacy property, so never "improve" it to store days.
 *
 * `fromCoarseWindow` is the ONLY sanctioned inverse — see the warning there
 * about why a naive rehydration is a correctness bug.
 */
export function toCoarseWindow(window: DobWindow): CoarseWindow {
  const loIso = toISODate(window.lo);
  const hiIso = toISODate(window.hi);
  return { loMonth: loIso.slice(0, 7), hiMonth: hiIso.slice(0, 7) };
}

/**
 * Rehydrate a coarse window, WIDENING to the safe outer bounds:
 *   lo -> FIRST day of loMonth   (lo is an exclusive lower bound, so earlier is weaker)
 *   hi -> LAST  day of hiMonth   (hi is an inclusive upper bound, so later is weaker)
 *
 * The `hi` case is the subtle one, and getting it wrong is a real bug:
 * rehydrating hi to the 1st of its month would make the window NARROWER than
 * the truth and could exclude the swimmer's actual birthday — silently
 * assigning them to the wrong age group. Example: a true window ending
 * 2014-03-07 coarsens to "2014-03"; rehydrating to 2014-03-01 is six days
 * tighter than the truth. Widening to 2014-03-31 is always safe.
 *
 * Guarantee: fromCoarseWindow(toCoarseWindow(w)) always CONTAINS w.
 */
export function fromCoarseWindow(coarse: CoarseWindow): DobWindow {
  return {
    lo: firstDayOfMonth(parseISOMonth(coarse.loMonth)),
    hi: lastDayOfMonth(parseISOMonth(coarse.hiMonth)),
  };
}

/** true if `outer` fully contains `inner`. */
export function windowContains(outer: DobWindow, inner: DobWindow): boolean {
  return !isAfter(outer.lo, inner.lo) && !isBefore(outer.hi, inner.hi);
}

/**
 * Intersect two DOB windows, or null if they're disjoint.
 *
 * The persistence layer must INTERSECT a rehydrated stored window with the
 * freshly-computed one, never substitute it. Because rehydration widens (by up
 * to ~62 days), substituting a stored window could flip a swimmer from a
 * certain age group to an uncertain one — losing information across a refresh.
 * Intersection guarantees the result is a subset of the live window, so the
 * store can only ever help, never degrade.
 */
export function intersectDobWindows(a: DobWindow, b: DobWindow): DobWindow | null {
  const lo = isAfter(a.lo, b.lo) ? a.lo : b.lo;
  const hi = isBefore(a.hi, b.hi) ? a.hi : b.hi;
  if (isAfter(lo, hi)) return null;
  return { lo, hi };
}
