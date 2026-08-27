/**
 * WAGZ age groups: 10&U, 11-12, 13-14. Age is always "on the first day of
 * competition" of the target meet — never current age. 15+ is ineligible.
 */
export type AgeGroup = "10U" | "11-12" | "13-14";

export const AGE_GROUPS: readonly AgeGroup[] = ["10U", "11-12", "13-14"];

/** Maps a WAGZ age to its age group, or null if the swimmer is 15+ (ineligible). */
export function ageGroupForAge(age: number): AgeGroup | null {
  if (!Number.isInteger(age) || age < 0) {
    throw new Error(`Invalid age: ${age}`);
  }
  if (age <= 10) return "10U";
  if (age <= 12) return "11-12";
  if (age <= 14) return "13-14";
  return null; // 15+
}
