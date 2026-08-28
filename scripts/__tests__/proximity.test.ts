import { describe, expect, it } from "vitest";
import standardsData from "../../data/standards.json" with { type: "json" };
import {
  getAaStandardSeconds,
  getAaaaStandardSeconds,
  getStandardSeconds,
  proximityTier,
  type StandardsData,
} from "../lib/standards.js";
import { parseTime } from "../lib/time.js";

const standards = standardsData as unknown as StandardsData;

describe("proximityTier", () => {
  const cut = 26.99; // 11-12 girls 50 Free SCY AAA

  it("at or under the cut is 'aaa'", () => {
    expect(proximityTier(26.99, cut)).toBe("aaa");
    expect(proximityTier(25.5, cut)).toBe("aaa");
  });

  it("a swim a fraction off is 'close'", () => {
    expect(proximityTier(27.1, cut)).toBe("close");
    expect(proximityTier(27.4, cut)).toBe("close");
  });

  it("a real but reachable gap is 'working', NOT 'close'", () => {
    expect(proximityTier(28.2, cut)).toBe("working");
  });

  it("REGRESSION: a swimmer far off the cut is never told they're close", () => {
    // The reported bug: the calculator said "So close!" for ANY non-AAA time.
    // A 47-second 50 free is 20 seconds off and must not read as close.
    expect(proximityTier(47.0, cut)).toBe("developing");
    expect(proximityTier(35.0, cut)).toBe("developing");
    for (const swum of [30.0, 33.3, 40.0, 60.0]) {
      expect(proximityTier(swum, cut)).not.toBe("close");
      expect(proximityTier(swum, cut)).not.toBe("aaa");
    }
  });

  it("tiers are monotonic — getting slower never moves you closer", () => {
    const order = { aaa: 0, close: 1, working: 2, developing: 3 } as const;
    let previous = -1;
    for (let swum = 26.0; swum <= 45; swum += 0.25) {
      const rank = order[proximityTier(swum, cut)];
      expect(rank).toBeGreaterThanOrEqual(previous);
      previous = rank;
    }
  });
});

describe("proximityTier with real AA data (the rule we actually want)", () => {
  const aaaCut = 26.99;
  const aaCut = 28.49; // illustrative AA standard, slower than AAA

  it("a swim at or faster than AA counts as 'close'", () => {
    expect(proximityTier(28.49, aaaCut, aaCut)).toBe("close");
    expect(proximityTier(27.5, aaaCut, aaCut)).toBe("close");
  });

  it("a swim SLOWER than AA is never 'close' — the owner's stated rule", () => {
    expect(proximityTier(28.5, aaaCut, aaCut)).not.toBe("close");
    expect(proximityTier(30.0, aaaCut, aaCut)).not.toBe("close");
    expect(proximityTier(45.0, aaaCut, aaCut)).toBe("developing");
  });

  it("AA data overrides the percentage fallback", () => {
    // 27.4 is within the interim 2% band, so the fallback calls it "close".
    expect(proximityTier(27.4, aaaCut)).toBe("close");
    // With a STRICTER hypothetical AA of 27.2, the same swim is no longer close.
    expect(proximityTier(27.4, aaaCut, 27.2)).not.toBe("close");
  });

  it("still reports 'aaa' regardless of AA data", () => {
    expect(proximityTier(26.0, aaaCut, aaCut)).toBe("aaa");
  });
});

describe("getAaStandardSeconds (real AA data from the official PDF)", () => {
  it("reads AA times for every age group and course", () => {
    expect(getAaStandardSeconds(standards, "11-12", "50FR", "SCY", "F")).toBeCloseTo(28.09);
    expect(getAaStandardSeconds(standards, "11-12", "50FR", "SCY", "M")).toBeCloseTo(26.99);
    expect(getAaStandardSeconds(standards, "13-14", "100FR", "LCM", "F")).toBeCloseTo(
      parseTime("1:06.69")!
    );
    expect(getAaStandardSeconds(standards, "10U", "200IM", "SCM", "M")).toBeDefined();
  });

  it("returns undefined for an event that doesn't exist", () => {
    expect(getAaStandardSeconds(standards, "11-12", "NOT-REAL", "SCY", "F")).toBeUndefined();
  });
});

describe("AA/AAA invariants across the whole standards table", () => {
  const AGE_GROUPS = ["10U", "11-12", "13-14"] as const;
  const COURSES = ["LCM", "SCM", "SCY"] as const;
  const GENDERS = ["F", "M"] as const;

  it("every event in every course and gender has BOTH an AAA and an AA time", () => {
    let count = 0;
    for (const ag of AGE_GROUPS) {
      for (const ev of standards.ageGroups[ag].events) {
        for (const course of COURSES) {
          for (const gender of GENDERS) {
            const aaa = getStandardSeconds(standards, ag, ev.key, course, gender);
            const aa = getAaStandardSeconds(standards, ag, ev.key, course, gender);
            expect(aaa, `AAA missing: ${ag} ${ev.key} ${course} ${gender}`).toBeDefined();
            expect(aa, `AA missing: ${ag} ${ev.key} ${course} ${gender}`).toBeDefined();
            count++;
          }
        }
      }
    }
    expect(count).toBe(252);
  });

  it("AA is ALWAYS slower than AAA — catches a swapped column in the source table", () => {
    // The PDF prints girls slowest-to-fastest and boys fastest-to-slowest. If
    // that mirroring were mis-parsed, AA would come out faster than AAA
    // somewhere. This is the guard for the whole extraction.
    for (const ag of AGE_GROUPS) {
      for (const ev of standards.ageGroups[ag].events) {
        for (const course of COURSES) {
          for (const gender of GENDERS) {
            const aaa = getStandardSeconds(standards, ag, ev.key, course, gender)!;
            const aa = getAaStandardSeconds(standards, ag, ev.key, course, gender)!;
            expect(aa, `${ag} ${ev.key} ${course} ${gender}: AA ${aa} must exceed AAA ${aaa}`).toBeGreaterThan(aaa);
          }
        }
      }
    }
  });

  it("every event has an AAAA time too (252 values)", () => {
    let count = 0;
    for (const ag of AGE_GROUPS) {
      for (const ev of standards.ageGroups[ag].events) {
        for (const course of COURSES) {
          for (const gender of GENDERS) {
            expect(
              getAaaaStandardSeconds(standards, ag, ev.key, course, gender),
              `AAAA missing: ${ag} ${ev.key} ${course} ${gender}`
            ).toBeDefined();
            count++;
          }
        }
      }
    }
    expect(count).toBe(252);
  });

  it("the full ladder is strictly ordered: AAAA < AAA < AA", () => {
    // The single strongest guard on the whole extraction. The source PDF
    // mirrors its boys columns, so any mis-parse would break this ordering
    // somewhere across the 252 rows.
    for (const ag of AGE_GROUPS) {
      for (const ev of standards.ageGroups[ag].events) {
        for (const course of COURSES) {
          for (const gender of GENDERS) {
            const aaaa = getAaaaStandardSeconds(standards, ag, ev.key, course, gender)!;
            const aaa = getStandardSeconds(standards, ag, ev.key, course, gender)!;
            const aa = getAaStandardSeconds(standards, ag, ev.key, course, gender)!;
            const where = `${ag} ${ev.key} ${course} ${gender}`;
            expect(aaaa, `${where}: AAAA ${aaaa} must be faster than AAA ${aaa}`).toBeLessThan(aaa);
            expect(aaa, `${where}: AAA ${aaa} must be faster than AA ${aa}`).toBeLessThan(aa);
          }
        }
      }
    }
  });

  it("a swim between AA and AAA is 'close'; anything slower than AA never is", () => {
    for (const ag of AGE_GROUPS) {
      for (const ev of standards.ageGroups[ag].events) {
        const aaa = getStandardSeconds(standards, ag, ev.key, "SCY", "F")!;
        const aa = getAaStandardSeconds(standards, ag, ev.key, "SCY", "F")!;
        // Exactly AA -> close. Just slower than AA -> never close.
        expect(proximityTier(aa, aaa, aa)).toBe("close");
        expect(proximityTier(aa + 0.01, aaa, aa)).not.toBe("close");
        expect(proximityTier(aa * 1.5, aaa, aa)).not.toBe("close");
      }
    }
  });
});
