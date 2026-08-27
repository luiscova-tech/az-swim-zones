import { describe, expect, it } from "vitest";
import { ageGroupForAge } from "../lib/ageGroup.js";

describe("ageGroupForAge", () => {
  it.each([
    [8, "10U"],
    [10, "10U"],
    [11, "11-12"],
    [12, "11-12"],
    [13, "13-14"],
    [14, "13-14"],
  ] as const)("age %i -> %s", (age, expected) => {
    expect(ageGroupForAge(age)).toBe(expected);
  });

  it("returns null for 15+ (ineligible)", () => {
    expect(ageGroupForAge(15)).toBeNull();
    expect(ageGroupForAge(17)).toBeNull();
  });

  it("rejects invalid ages", () => {
    expect(() => ageGroupForAge(-1)).toThrow();
    expect(() => ageGroupForAge(1.5)).toThrow();
  });
});
