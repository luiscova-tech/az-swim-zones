import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONSENT_LEVEL,
  displayNameFor,
  mayAppear,
  mayUseInAnnouncements,
  resolveConsentLevel,
  toInitialName,
  type ConsentLevel,
} from "../lib/displayName.js";

describe("toInitialName", () => {
  it.each([
    ["Ana Lopez", "Ana L."],
    ["ana lopez", "ana l."],
    ["  Ana   Lopez  ", "Ana L."],
  ])("%s -> %s", (input, expected) => {
    expect(toInitialName(input)).toBe(expected);
  });

  it("drops middle names rather than showing them (a middle name narrows the field)", () => {
    expect(toInitialName("Ana Maria Lopez")).toBe("Ana L.");
    expect(toInitialName("Ana Maria Lopez Garcia")).toBe("Ana G.");
  });

  it("abbreviates a hyphenated surname to ONE letter, not two", () => {
    // "Ana L-G." would be more identifying than "Ana L.", defeating the point.
    expect(toInitialName("Ana Lopez-Garcia")).toBe("Ana L.");
  });

  it("handles apostrophe surnames", () => {
    expect(toInitialName("Sean O'Brien")).toBe("Sean O.");
  });

  it("returns a single-word name unchanged rather than inventing a surname", () => {
    expect(toInitialName("Cher")).toBe("Cher");
  });

  it("keeps accented characters intact", () => {
    expect(toInitialName("José Álvarez")).toBe("José Á.");
  });

  it("returns empty string for empty input instead of throwing", () => {
    expect(toInitialName("")).toBe("");
    expect(toInitialName("   ")).toBe("");
  });
});

describe("displayNameFor", () => {
  it("shows the full name only when consent says so", () => {
    expect(displayNameFor("Ana Lopez", "full")).toBe("Ana Lopez");
    expect(displayNameFor("Ana Lopez", "full-with-announcements")).toBe("Ana Lopez");
  });

  it("abbreviates by default", () => {
    expect(displayNameFor("Ana Lopez", "initial")).toBe("Ana L.");
  });

  it("returns null -- not a name -- when excluded", () => {
    expect(displayNameFor("Ana Lopez", "excluded")).toBeNull();
  });

  it("fails SAFE toward less disclosure for an unrecognized level", () => {
    // Simulates a hand-edited consent file or a level added later.
    const bogus = "vip-super-full" as unknown as ConsentLevel;
    expect(displayNameFor("Ana Lopez", bogus)).toBe("Ana L.");
  });
});

describe("consent gates", () => {
  it("defaults to the least-disclosing level that still appears", () => {
    expect(DEFAULT_CONSENT_LEVEL).toBe("initial");
  });

  it("only the announcements level permits announcement use", () => {
    expect(mayUseInAnnouncements("full-with-announcements")).toBe(true);
    for (const level of ["initial", "full", "excluded"] as const) {
      expect(mayUseInAnnouncements(level)).toBe(false);
    }
  });

  it("full name alone does NOT imply announcement permission", () => {
    // A parent opting into a name on the board has not thereby agreed to
    // their child being used in social posts. These are separate choices.
    expect(mayUseInAnnouncements("full")).toBe(false);
  });

  it("mayAppear is false only for excluded", () => {
    expect(mayAppear("excluded")).toBe(false);
    for (const level of ["initial", "full", "full-with-announcements"] as const) {
      expect(mayAppear(level)).toBe(true);
    }
  });
});

describe("resolveConsentLevel", () => {
  it("defaults to 'initial' when a swimmer has no consent record", () => {
    expect(resolveConsentLevel({}, "ana-lopez")).toBe("initial");
  });

  it("never escalates from a missing or corrupt record", () => {
    for (const bad of [undefined, "", "FULL", "yes", "true", "admin"]) {
      expect(resolveConsentLevel({ "ana-lopez": bad }, "ana-lopez")).toBe("initial");
    }
  });

  it("honours a valid recorded level, including exclusion", () => {
    expect(resolveConsentLevel({ "ana-lopez": "full" }, "ana-lopez")).toBe("full");
    expect(resolveConsentLevel({ "ana-lopez": "excluded" }, "ana-lopez")).toBe("excluded");
    expect(resolveConsentLevel({ "ana-lopez": "full-with-announcements" }, "ana-lopez")).toBe(
      "full-with-announcements"
    );
  });
});
