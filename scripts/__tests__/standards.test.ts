import { describe, expect, it } from "vitest";
import standardsData from "../../data/standards.json" with { type: "json" };
import { compareToStandard, evaluateTime, getStandardSeconds, type StandardsData } from "../lib/standards.js";
import { parseTime } from "../lib/time.js";

const standards = standardsData as unknown as StandardsData;

describe("getStandardSeconds (real standards.json data)", () => {
  it("looks up 10U girls 50 Free LCM", () => {
    expect(getStandardSeconds(standards, "10U", "50FR", "LCM", "F")).toBeCloseTo(33.69);
  });

  it("looks up 13-14 boys 100 Free SCY", () => {
    expect(getStandardSeconds(standards, "13-14", "100FR", "SCY", "M")).toBeCloseTo(51.09);
  });

  it("distinguishes the 400/500 free course-dependent event correctly", () => {
    // 11-12 girls: 400 Free in LCM/SCM, but 500 Free in SCY. Same event key, different distance.
    expect(getStandardSeconds(standards, "11-12", "400FR", "LCM", "F")).toBeCloseTo(5 * 60 + 8.69);
    expect(getStandardSeconds(standards, "11-12", "400FR", "SCY", "F")).toBeCloseTo(5 * 60 + 43.29);
    const event = standards.ageGroups["11-12"].events.find((e) => e.key === "400FR")!;
    expect(event.distance.LCM).toBe(400);
    expect(event.distance.SCY).toBe(500);
  });

  it("returns undefined for an event not offered in that age group", () => {
    // 13-14 doesn't swim 50 Back in the WAGZ program, but IS in the full standards table
    // for the calculator -- so this should resolve, not be missing.
    expect(getStandardSeconds(standards, "13-14", "50BK", "SCY", "F")).toBeCloseTo(28.49);
    // A genuinely nonexistent key should come back undefined.
    expect(getStandardSeconds(standards, "13-14", "NOT-A-REAL-EVENT", "SCY", "F")).toBeUndefined();
  });
});

describe("wagzEventProgram", () => {
  it("has the documented event counts per age group", () => {
    expect(standards.wagzEventProgram["10U"]).toHaveLength(10);
    expect(standards.wagzEventProgram["11-12"]).toHaveLength(15);
    expect(standards.wagzEventProgram["13-14"]).toHaveLength(14);
  });

  it("excludes 50s of stroke from the 13-14 WAGZ program despite them being in the full table", () => {
    const program1314 = standards.wagzEventProgram["13-14"];
    expect(program1314).not.toContain("50BK");
    expect(program1314).not.toContain("50BR");
    expect(program1314).not.toContain("50FL");
    expect(standards.ageGroups["13-14"].events.map((e) => e.key)).toContain("50BK");
  });
});

describe("compareToStandard", () => {
  it("marks a faster time as AAA with a negative gap", () => {
    const result = compareToStandard(58.21, 58.69);
    expect(result.isAAA).toBe(true);
    expect(result.gapSeconds).toBeCloseTo(-0.48);
    expect(result.gapPercent).toBeLessThan(0);
  });

  it("marks an exact tie as AAA (<=, not strictly <)", () => {
    expect(compareToStandard(58.69, 58.69).isAAA).toBe(true);
  });

  it("marks a slower time as not-AAA with a positive gap", () => {
    const result = compareToStandard(59.11, 58.69);
    expect(result.isAAA).toBe(false);
    expect(result.gapSeconds).toBeCloseTo(0.42);
  });
});

describe("evaluateTime never converts between courses", () => {
  it("looks up a distinct standard per course for the same event/age/gender", () => {
    const scy = evaluateTime(standards, "13-14", "100FR", "SCY", "F", parseTime("55.79")!)!;
    const lcm = evaluateTime(standards, "13-14", "100FR", "LCM", "F", parseTime("1:03.79")!)!;
    expect(scy.standardSeconds).toBeCloseTo(55.79);
    expect(lcm.standardSeconds).toBeCloseTo(63.79);
    expect(scy.standardSeconds).not.toBeCloseTo(lcm.standardSeconds);
  });

  it("gives opposite AAA verdicts for the same raw time depending on which course it's checked against", () => {
    // 13-14 girls 100 Free: SCY cut is 55.79, LCM cut is 63.79 (yards pools run
    // numerically faster times for the same event -- exactly why they're never
    // interchangeable). The same 62.00 clears the LCM cut but misses the SCY one.
    const swum = 62.0;
    const scy = evaluateTime(standards, "13-14", "100FR", "SCY", "F", swum)!;
    const lcm = evaluateTime(standards, "13-14", "100FR", "LCM", "F", swum)!;
    expect(scy.isAAA).toBe(false);
    expect(lcm.isAAA).toBe(true);
  });
});
