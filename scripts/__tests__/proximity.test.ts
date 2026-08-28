import { describe, expect, it } from "vitest";
import standardsData from "../../data/standards.json" with { type: "json" };
import {
  getAaStandardSeconds,
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

describe("getAaStandardSeconds", () => {
  it("returns undefined while standards.json carries no AA table", () => {
    // Documents current state. When the real AA table is added this flips, and
    // the calculator switches to the exact rule with no other code change.
    expect(getAaStandardSeconds(standards, "11-12", "50FR", "SCY", "F")).toBeUndefined();
  });

  it("reads an AA time when one is present", () => {
    const withAa = {
      ...standards,
      ageGroups: {
        ...standards.ageGroups,
        "11-12": {
          ...standards.ageGroups["11-12"],
          events: standards.ageGroups["11-12"].events.map((e) =>
            e.key === "50FR"
              ? { ...e, aaStandards: { girls: { SCY: "28.49" }, boys: { SCY: "27.29" } } }
              : e
          ),
        },
      },
    } as unknown as StandardsData;
    expect(getAaStandardSeconds(withAa, "11-12", "50FR", "SCY", "F")).toBeCloseTo(parseTime("28.49")!);
    expect(getAaStandardSeconds(withAa, "11-12", "50FR", "LCM", "F")).toBeUndefined();
  });
});
