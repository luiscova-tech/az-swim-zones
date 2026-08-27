import { ageAt, isAfter, isBefore, parseISODate, subtractYears, toISODate } from "./date-utils.js";
import { ageGroupForAge, type AgeGroup } from "./ageGroup.js";

/**
 * One published result: a swimmer's age *at that meet* (never their DOB —
 * public results don't publish birthdates, and we never collect them).
 */
export interface AgeObservation {
  meetDate: string; // "YYYY-MM-DD"
  ageAtMeet: number;
}

export interface DobWindow {
  /** Exclusive lower bound: DOB is strictly after this date. */
  lo: Date;
  /** Inclusive upper bound: DOB is on or before this date. */
  hi: Date;
}

/**
 * A single observation (meetDate, ageAtMeet) constrains DOB to:
 *   DOB ∈ ( meetDate − (age+1) years , meetDate − age years ]
 * (Born any later than the upper bound and they'd have been younger at the
 * meet; any earlier than the lower bound and they'd have been older.)
 */
export function windowFromObservation(obs: AgeObservation): DobWindow {
  const meetDate = parseISODate(obs.meetDate);
  return {
    lo: subtractYears(meetDate, obs.ageAtMeet + 1),
    hi: subtractYears(meetDate, obs.ageAtMeet),
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

/** Coarse (month-granularity) serialization for the internal, non-public persistence file. */
export function toCoarseWindow(window: DobWindow): { loMonth: string; hiMonth: string } {
  const loIso = toISODate(window.lo);
  const hiIso = toISODate(window.hi);
  return { loMonth: loIso.slice(0, 7), hiMonth: hiIso.slice(0, 7) };
}
