import { describe, expect, it } from "vitest";
import { intersectWindows, resolveAgeGroup } from "../lib/ageWindow.js";

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
