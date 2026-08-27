/**
 * How a swimmer's name may be shown, and how much of it.
 *
 * The default for any swimmer we have no record for is `initial` — a family
 * has to actively choose more. Nothing here ever escalates on its own: an
 * absent consent record means LESS disclosure, never more.
 */
export type ConsentLevel =
  /** Excluded from every page, every count, and every generated image. */
  | "excluded"
  /** Default. "Ana L." — shown on the board, but not fully named. */
  | "initial"
  /** Parent chose to show the full name on the board. */
  | "full"
  /** Parent chose full name AND use in announcements/social posts. */
  | "full-with-announcements";

export const DEFAULT_CONSENT_LEVEL: ConsentLevel = "initial";

/** Consent levels that permit using a swimmer's name in announcements. */
export function mayUseInAnnouncements(level: ConsentLevel): boolean {
  return level === "full-with-announcements";
}

/** Consent levels that permit the swimmer appearing at all. */
export function mayAppear(level: ConsentLevel): boolean {
  return level !== "excluded";
}

/**
 * Abbreviate a full name to first name + last initial: "Ana Lopez" -> "Ana L."
 *
 * Deliberately conservative about what counts as a surname, because getting
 * this wrong exposes more than intended:
 *  - Only the FINAL name part is abbreviated; middle names are dropped, not
 *    shown, since "Ana Maria L." narrows the field further than "Ana L.".
 *  - A single-word name is returned as-is (there is no surname to abbreviate,
 *    and inventing one would be wrong).
 *  - Hyphenated and apostrophe surnames abbreviate to their first letter only
 *    ("Lopez-Garcia" -> "L.", "O'Brien" -> "O."), never "L-G." which would be
 *    more identifying, not less.
 */
export function toInitialName(fullName: string): string {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (cleaned === "") return "";

  const parts = cleaned.split(" ");
  const first = parts[0]!;
  if (parts.length === 1) return first;

  const surname = parts[parts.length - 1]!;
  // Use the first character of the surname. Array spread (not charAt) so a
  // surname starting with a multi-byte character keeps its full grapheme.
  const initial = [...surname][0] ?? "";
  return `${first} ${initial}.`;
}

/**
 * The single function every page and generated image must call to render a
 * swimmer's name. Returns null when the swimmer must not be shown at all —
 * callers MUST treat null as "render nothing", never as "fall back to the
 * full name".
 */
export function displayNameFor(fullName: string, level: ConsentLevel): string | null {
  switch (level) {
    case "excluded":
      return null;
    case "full":
    case "full-with-announcements":
      return fullName.trim().replace(/\s+/g, " ");
    case "initial":
      return toInitialName(fullName);
    default: {
      // An unrecognized level (e.g. a hand-edited consent file, or a level
      // added later) must fail SAFE toward less disclosure, not more.
      const _exhaustive: never = level;
      void _exhaustive;
      return toInitialName(fullName);
    }
  }
}

/**
 * Resolve a swimmer's consent level from a consent record map, defaulting to
 * `initial` when there is no record. Unknown/corrupt values also fall back to
 * the default rather than being trusted.
 */
export function resolveConsentLevel(
  consentByKey: Record<string, string | undefined>,
  swimmerKey: string
): ConsentLevel {
  const raw = consentByKey[swimmerKey];
  switch (raw) {
    case "excluded":
    case "initial":
    case "full":
    case "full-with-announcements":
      return raw;
    default:
      return DEFAULT_CONSENT_LEVEL;
  }
}
