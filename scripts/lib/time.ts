/**
 * Race-time parsing. Every displayed and compared time in this project flows
 * through here — meet results AND the AAA standards table both get parsed by
 * the same function, so there's exactly one definition of "what a time means."
 */

/** Tokens meets use in place of a real time. None of these are "0 seconds". */
const NO_TIME_TOKENS = new Set(["DQ", "NS", "DNF", "SCR", "NT", "DFS", "X"]);

/**
 * Parse a race time into seconds.
 *  - "1:03.45" -> 63.45
 *  - "29.59"   -> 29.59
 *  - "10:01.49" -> 601.49
 *  - "DQ" / "NS" / "DNF" / "SCR" / "NT" / "DFS" / "X" -> null (no time, not zero)
 * Throws on anything else unparseable, so bad scraped data fails loudly
 * instead of silently becoming 0 and looking like a world record.
 */
export function parseTime(raw: string): number | null {
  const trimmed = raw.trim();
  if (NO_TIME_TOKENS.has(trimmed.toUpperCase())) {
    return null;
  }

  // mm:ss.hh or h:mm:ss.hh (allow multiple ':' groups for very long distance races)
  const parts = trimmed.split(":");
  if (parts.length < 1 || parts.length > 3) {
    throw new Error(`Unparseable time: "${raw}"`);
  }

  const secondsPart = parts[parts.length - 1];
  if (secondsPart === undefined || !/^\d+(\.\d+)?$/.test(secondsPart)) {
    throw new Error(`Unparseable time: "${raw}"`);
  }

  let totalSeconds = Number.parseFloat(secondsPart);
  for (let i = parts.length - 2; i >= 0; i--) {
    const unit = parts[i];
    if (unit === undefined || !/^\d+$/.test(unit)) {
      throw new Error(`Unparseable time: "${raw}"`);
    }
    const multiplier = parts.length - 1 - i === 1 ? 60 : 3600;
    totalSeconds += Number.parseInt(unit, 10) * multiplier;
  }

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    throw new Error(`Unparseable time: "${raw}"`);
  }

  return totalSeconds;
}

/** Format seconds back to a display string: 63.45 -> "1:03.45", 29.59 -> "29.59". */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new Error(`Cannot format negative/non-finite seconds: ${totalSeconds}`);
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds - hours * 3600 - minutes * 60;
  const secondsStr = seconds.toFixed(2).padStart(5, "0"); // "05.30"

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secondsStr}`;
  }
  if (minutes > 0) {
    return `${minutes}:${secondsStr}`;
  }
  return seconds.toFixed(2);
}

export function isNoTimeToken(raw: string): boolean {
  return NO_TIME_TOKENS.has(raw.trim().toUpperCase());
}
