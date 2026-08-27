import { describe, expect, it } from "vitest";
import { ageAt, parseISODate, subtractYears, toISODate } from "../lib/date-utils.js";

describe("parseISODate / toISODate", () => {
  it("round-trips a valid date", () => {
    expect(toISODate(parseISODate("2026-08-27"))).toBe("2026-08-27");
  });

  it("rejects malformed strings", () => {
    expect(() => parseISODate("08/27/2026")).toThrow();
  });

  it("rejects impossible calendar dates", () => {
    expect(() => parseISODate("2026-02-30")).toThrow();
  });
});

describe("subtractYears", () => {
  it("subtracts whole years", () => {
    expect(toISODate(subtractYears(parseISODate("2027-08-04"), 13))).toBe("2014-08-04");
  });
});

describe("ageAt", () => {
  it("counts a full year once the birthday has passed", () => {
    expect(ageAt(parseISODate("2013-03-01"), parseISODate("2027-08-04"))).toBe(14);
  });

  it("has not yet counted the year if the birthday hasn't happened yet", () => {
    expect(ageAt(parseISODate("2013-09-01"), parseISODate("2027-08-04"))).toBe(13);
  });

  it("counts the birthday itself as the new age", () => {
    expect(ageAt(parseISODate("2013-08-04"), parseISODate("2027-08-04"))).toBe(14);
  });
});
