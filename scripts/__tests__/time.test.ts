import { describe, expect, it } from "vitest";
import { formatTime, isNoTimeToken, parseTime } from "../lib/time.js";

describe("parseTime", () => {
  it("parses plain seconds", () => {
    expect(parseTime("29.59")).toBeCloseTo(29.59);
  });

  it("parses minutes:seconds", () => {
    expect(parseTime("1:03.45")).toBeCloseTo(63.45);
  });

  it("parses hours:minutes:seconds for long distance events", () => {
    expect(parseTime("19:13.69")).toBeCloseTo(19 * 60 + 13.69);
  });

  for (const token of ["DQ", "NS", "DNF", "SCR", "NT", "DFS", "X", "dq", "ns"]) {
    it(`treats "${token}" as no-time (null), never zero`, () => {
      expect(parseTime(token)).toBeNull();
    });
  }

  it("throws on unparseable garbage instead of silently returning 0", () => {
    expect(() => parseTime("banana")).toThrow();
  });

  it("throws on a non-positive time", () => {
    expect(() => parseTime("0.00")).toThrow();
  });
});

describe("formatTime", () => {
  it("formats sub-minute times with no minutes prefix", () => {
    expect(formatTime(29.59)).toBe("29.59");
  });

  it("formats minute+ times as m:ss.hh", () => {
    expect(formatTime(63.45)).toBe("1:03.45");
  });

  it("round-trips through parseTime", () => {
    for (const raw of ["29.59", "1:03.45", "10:01.49"]) {
      const seconds = parseTime(raw);
      expect(seconds).not.toBeNull();
      expect(formatTime(seconds!)).toBe(raw);
    }
  });
});

describe("isNoTimeToken", () => {
  it("recognizes no-time tokens case-insensitively", () => {
    expect(isNoTimeToken("dnf")).toBe(true);
    expect(isNoTimeToken("29.59")).toBe(false);
  });
});
