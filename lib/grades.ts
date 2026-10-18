import { grades } from "./data";
import type { Grade } from "./types";

/** 5-point school scale from a 5-question check. */
export function scoreToGrade(score: number, max = 5): number {
  const ratio = score / max;
  if (ratio >= 1) return 5;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  return 2;
}

export function gradesFor(studentId: string): Grade[] {
  return grades.filter((g) => g.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}

export const GRADE_TONE: Record<number, string> = {
  5: "text-correct",
  4: "text-accent",
  3: "text-unsure",
  2: "text-wrong",
};
