// Pure class-level analysis of a check. Shared by the UI and /api/groups,
// so grouping is always decided in code — the AI only writes texts.

import type { Group, SheetResult, Student, Worksheet } from "./types";
import { skillName } from "./skills";

export type QuestionStat = {
  n: number;
  skillId: string;
  wrong: number;
  unsure: number;
  /** Most frequent wrong answer and how many students wrote it. */
  topWrong: { read: string; count: number } | null;
};

export type ClassSummary = {
  total: number;
  averageScore: number;
  maxScore: number;
  questionStats: QuestionStat[];
  mainProblem: QuestionStat | null;
  secondProblem: QuestionStat | null;
  unsureCount: number;
};

export const UNSURE_THRESHOLD = 0.7;

export function isUnsure(confidence: number) {
  return confidence < UNSURE_THRESHOLD;
}

/** Anything with numbered, skill-tagged questions: today's worksheet or a past check. */
type CheckShape = { questions: Pick<Worksheet["questions"][number], "n" | "skillId">[] };

export function summarizeClass(worksheet: CheckShape, results: SheetResult[]): ClassSummary {
  const questionStats = worksheet.questions.map<QuestionStat>((q) => {
    const answers = results.map((r) => r.answers.find((a) => a.n === q.n)).filter((a) => a !== undefined);
    const wrongReads = new Map<string, number>();
    for (const a of answers) {
      if (!a.correct) wrongReads.set(a.read, (wrongReads.get(a.read) ?? 0) + 1);
    }
    const [topRead, topCount] = [...wrongReads].sort((a, b) => b[1] - a[1])[0] ?? [];
    return {
      n: q.n,
      skillId: q.skillId,
      wrong: answers.filter((a) => !a.correct).length,
      unsure: answers.filter((a) => isUnsure(a.confidence)).length,
      topWrong: topRead !== undefined ? { read: topRead, count: topCount! } : null,
    };
  });

  const ranked = [...questionStats].filter((s) => s.wrong > 0).sort((a, b) => b.wrong - a.wrong || a.n - b.n);
  const total = results.length;

  return {
    total,
    averageScore: total ? results.reduce((sum, r) => sum + r.score, 0) / total : 0,
    maxScore: worksheet.questions.length,
    questionStats,
    mainProblem: ranked[0] ?? null,
    secondProblem: ranked[1] ?? null,
    unsureCount: questionStats.reduce((sum, s) => sum + s.unsure, 0),
  };
}

export type GroupTasks = Record<string, string> & { advanced: string };

/**
 * Three groups, decided in code:
 * 1) everyone who missed the main problem, 2) missed the second one (and not the first),
 * 3) the rest — no mistakes on the key topics, so they get a harder task.
 */
export function buildGroups(
  summary: ClassSummary,
  results: SheetResult[],
  students: Student[],
  tasks: GroupTasks,
): Group[] {
  const byNumber = (ids: string[]) =>
    ids.sort((a, b) => (students.find((s) => s.id === a)?.number ?? 0) - (students.find((s) => s.id === b)?.number ?? 0));

  const missed = (r: SheetResult, n: number | undefined) =>
    n !== undefined && r.answers.some((a) => a.n === n && !a.correct);

  const main = summary.mainProblem;
  const second = summary.secondProblem;
  const g1 = results.filter((r) => missed(r, main?.n)).map((r) => r.studentId);
  const g2 = results.filter((r) => !g1.includes(r.studentId) && missed(r, second?.n)).map((r) => r.studentId);
  const g3 = results.map((r) => r.studentId).filter((id) => !g1.includes(id) && !g2.includes(id));

  const groups: Group[] = [];
  if (main) {
    groups.push({ id: "g1", title: skillName(main.skillId), skillId: main.skillId, studentIds: byNumber(g1), task: tasks[main.skillId] ?? "" });
  }
  if (second && g2.length) {
    groups.push({ id: "g2", title: skillName(second.skillId), skillId: second.skillId, studentIds: byNumber(g2), task: tasks[second.skillId] ?? "" });
  }
  groups.push({ id: "g3", title: "Murakkabroq topshiriq", skillId: null, studentIds: byNumber(g3), task: tasks.advanced });
  return groups;
}
