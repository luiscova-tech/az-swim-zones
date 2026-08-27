import { describe, expect, it } from "vitest";
import {
  fromCoarseWindow,
  intersectDobWindows,
  intersectWindows,
  resolveAgeGroup,
  toCoarseWindow,
  windowContains,
  windowFromObservation,
} from "../lib/ageWindow.js";
import { parseISODate, toISODate } from "../lib/date-utils.js";

// All cases resolve against the same target meet first-day-of-competition.
const W = "2027-08-04";

describe("resolveAgeGroup", () => {
  it("certain-young: two observations narrow the window entirely inside the 10&U bracket", () => {
    const result = resolveAgeGroup(
      [
        { meetDate: "2024-03-01", ageAtMeet: 7 },
        { meetDate: "2026-09-01", ageAtMeet: 9 },
      ],
      W
    );
    expect(result.certain).toBe(true);
    expect(result.ageUncertain).toBe(false);
    expect(result.wagzAge).toBe(10);
    expect(result.ageGroup).toBe("10U");
    expect(result.eligible).toBe(true);
  });

  it("certain-old: two observations narrow the window entirely inside the 13-14 bracket", () => {
    const result = resolveAgeGroup(
      [
        { meetDate: "2026-01-05", ageAtMeet: 12 },
        { meetDate: "2027-11-19", ageAtMeet: 13 },
      ],
      W
    );
    expect(result.certain).toBe(true);
    expect(result.ageUncertain).toBe(false);
    expect(result.wagzAge).toBe(13);
    expect(result.ageGroup).toBe("13-14");
    expect(result.eligible).toBe(true);
  });

  it("ambiguous-straddling: the window spans an age-group boundary (11-12 / 13-14) -> defaults younger, flagged", () => {
    const result = resolveAgeGroup(
      [
        { meetDate: "2025-09-10", ageAtMeet: 11 },
        { meetDate: "2026-04-01", ageAtMeet: 11 },
      ],
      W
    );
    expect(result.certain).toBe(false);
    expect(result.ageUncertain).toBe(true);
    expect(result.wagzAge).toBe(12); // younger hypothesis, never silently guessed as the older one
    expect(result.ageGroup).toBe("11-12");
    expect(result.eligible).toBe(true);
  });

  it("single-observation: a lone result gives a ~1-year window and is usually ambiguous -- expected, not an error", () => {
    const result = resolveAgeGroup([{ meetDate: "2026-01-01", ageAtMeet: 9 }], W);
    expect(result.ageUncertain).toBe(true);
    expect(result.wagzAge).toBe(10);
    expect(result.ageGroup).toBe("10U");
    expect(result.eligible).toBe(true);
  });

  it("15-year-old exclusion: a window certainly 15+ at the target meet is excluded, not assigned a group", () => {
    const result = resolveAgeGroup(
      [
        { meetDate: "2026-01-05", ageAtMeet: 14 },
        { meetDate: "2027-11-19", ageAtMeet: 15 },
      ],
      W
    );
    expect(result.certain).toBe(true);
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toBe("age-15-plus");
    expect(result.wagzAge).toBeNull();
    expect(result.ageGroup).toBeNull();
  });

  it("never throws on zero-margin ambiguity and always returns *a* usable group when eligible", () => {
    // A broad spread of single-meet observations across many possible ages should
    // always resolve to something renderable, never crash the build.
    for (let age = 0; age <= 14; age++) {
      const result = resolveAgeGroup([{ meetDate: "2026-06-15", ageAtMeet: age }], W);
      if (result.eligible) {
        expect(result.ageGroup).not.toBeNull();
      }
    }
  });
});

describe("intersectWindows", () => {
  it("flags mutually-exclusive observations as inconsistent and falls back to the most recent one", () => {
    const result = intersectWindows([
      { meetDate: "2026-01-01", ageAtMeet: 8 },
      { meetDate: "2026-06-01", ageAtMeet: 14 },
    ]);
    expect(result.inconsistent).toBe(true);
    // Falls back to the most recent observation (2026-06-01, age 14) alone.
    expect(result.hi.getUTCFullYear()).toBe(2012);
  });

  it("does not flag normal overlapping observations as inconsistent", () => {
    const result = intersectWindows([
      { meetDate: "2024-03-01", ageAtMeet: 7 },
      { meetDate: "2026-09-01", ageAtMeet: 9 },
    ]);
    expect(result.inconsistent).toBe(false);
  });
});

describe("age-GROUP-only observations (sources that publish no exact age)", () => {
  it("an exact age is equivalent to a degenerate range [a, a]", () => {
    const exact = windowFromObservation({ meetDate: "2026-03-14", ageAtMeet: 12 });
    const range = windowFromObservation({ meetDate: "2026-03-14", minAgeAtMeet: 12, maxAgeAtMeet: 12 });
    expect(toISODate(range.lo)).toBe(toISODate(exact.lo));
    expect(toISODate(range.hi)).toBe(toISODate(exact.hi));
  });

  it("an '11-12' age group yields a 2-year window, twice as wide as an exact age", () => {
    const w = windowFromObservation({ meetDate: "2026-03-14", minAgeAtMeet: 11, maxAgeAtMeet: 12 });
    expect(toISODate(w.lo)).toBe("2013-03-14"); // meetDate - (12+1) years
    expect(toISODate(w.hi)).toBe("2015-03-14"); // meetDate - 11 years
  });

  it("a range observation always CONTAINS the exact-age window it spans", () => {
    const range = windowFromObservation({ meetDate: "2026-03-14", minAgeAtMeet: 11, maxAgeAtMeet: 12 });
    for (const age of [11, 12]) {
      expect(windowContains(range, windowFromObservation({ meetDate: "2026-03-14", ageAtMeet: age }))).toBe(true);
    }
  });

  it("age-group-only data still narrows across meets, but leaves more swimmers uncertain", () => {
    // Same swimmer seen in 11-12 twice, ~18 months apart. Real intersection,
    // but not enough to pin a single age at the 2027 meet.
    const result = resolveAgeGroup(
      [
        { meetDate: "2025-09-10", minAgeAtMeet: 11, maxAgeAtMeet: 12 },
        { meetDate: "2027-03-01", minAgeAtMeet: 11, maxAgeAtMeet: 12 },
      ],
      "2027-08-04"
    );
    expect(result.eligible).toBe(true);
    expect(result.ageUncertain).toBe(true); // expected and correct -- we genuinely don't know
    expect(result.ageGroup).not.toBeNull();
  });

  it("mixing an exact observation with age-group ones tightens the window back down", () => {
    const groupOnly = resolveAgeGroup(
      [{ meetDate: "2026-03-14", minAgeAtMeet: 11, maxAgeAtMeet: 12 }],
      "2027-08-04"
    );
    const withExact = resolveAgeGroup(
      [
        { meetDate: "2026-03-14", minAgeAtMeet: 11, maxAgeAtMeet: 12 },
        { meetDate: "2026-07-20", ageAtMeet: 12 },
      ],
      "2027-08-04"
    );
    expect(groupOnly.ageUncertain).toBe(true);
    // The exact observation collapses the 2-year window to 1 year.
    expect(withExact.window.hi.getTime() - withExact.window.lo.getTime()).toBeLessThan(
      groupOnly.window.hi.getTime() - groupOnly.window.lo.getTime()
    );
  });

  it("rejects a backwards age range instead of silently accepting it", () => {
    expect(() => windowFromObservation({ meetDate: "2026-03-14", minAgeAtMeet: 12, maxAgeAtMeet: 11 })).toThrow();
  });
});

describe("coarse window round-trip (the privacy/correctness boundary)", () => {
  it("regression: rehydrating hi to the 1st would TIGHTEN the window and lose the true DOB", () => {
    // The exact case that motivated fromCoarseWindow. True hi is 2014-03-07;
    // a naive rehydration to 2014-03-01 is six days tighter than the truth.
    const truth = { lo: parseISODate("2013-11-15"), hi: parseISODate("2014-03-07") };
    const rehydrated = fromCoarseWindow(toCoarseWindow(truth));
    expect(toISODate(rehydrated.lo)).toBe("2013-11-01"); // widened earlier
    expect(toISODate(rehydrated.hi)).toBe("2014-03-31"); // widened later, NOT 2014-03-01
    expect(windowContains(rehydrated, truth)).toBe(true);
  });

  it("round-trip always CONTAINS the original window, across many shapes", () => {
    const cases: Array<[string, string]> = [
      ["2013-01-01", "2013-12-31"],
      ["2014-02-01", "2014-02-28"], // non-leap February
      ["2016-02-05", "2016-02-29"], // leap February -- last day is the 29th
      ["2015-06-30", "2015-07-01"], // straddles a month boundary
      ["2012-12-31", "2013-01-01"], // straddles a year boundary
      ["2014-08-05", "2014-08-20"], // both bounds inside one month
    ];
    for (const [lo, hi] of cases) {
      const truth = { lo: parseISODate(lo), hi: parseISODate(hi) };
      expect(windowContains(fromCoarseWindow(toCoarseWindow(truth)), truth)).toBe(true);
    }
  });

  it("stores only month granularity -- never a day-precise birthdate", () => {
    const coarse = toCoarseWindow({ lo: parseISODate("2013-11-15"), hi: parseISODate("2014-03-07") });
    expect(coarse.loMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(coarse.hiMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(JSON.stringify(coarse)).not.toContain("15");
    expect(JSON.stringify(coarse)).not.toContain("07");
  });
});

describe("intersectDobWindows (persistence must intersect, never substitute)", () => {
  it("intersecting a widened stored window with a live one preserves the tighter live bounds", () => {
    const live = { lo: parseISODate("2014-08-05"), hi: parseISODate("2014-08-20") };
    const stored = fromCoarseWindow(toCoarseWindow(live)); // widened to the whole month
    const merged = intersectDobWindows(live, stored)!;
    expect(toISODate(merged.lo)).toBe("2014-08-05");
    expect(toISODate(merged.hi)).toBe("2014-08-20");
    expect(windowContains(live, merged)).toBe(true); // never looser than live
  });

  it("returns null for genuinely disjoint windows rather than inventing an answer", () => {
    expect(
      intersectDobWindows(
        { lo: parseISODate("2013-01-01"), hi: parseISODate("2013-06-01") },
        { lo: parseISODate("2014-01-01"), hi: parseISODate("2014-06-01") }
      )
    ).toBeNull();
  });
});
