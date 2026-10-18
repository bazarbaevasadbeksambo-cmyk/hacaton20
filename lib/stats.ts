// Month statistics for one student, built from past checks plus the latest one.
// Pure functions: the same rules drive the teacher and the student views.

import type { HistoryCheck, SheetResult, Worksheet } from "./types";
import { SKILLS, skillName } from "./skills";

export type CheckPoint = { date: string; score: number; classAverage: number };

export type SkillTrend = "mastered" | "growing" | "declining" | "struggling";

export type SkillStat = {
  skillId: string;
  name: string;
  attempts: boolean[]; // chronological, true = correct
  trend: SkillTrend;
};

export type StudentStats = {
  points: CheckPoint[];
  monthAverage: number;
  /** Change between the average of the last two checks and the first two. */
  delta: number;
  skills: SkillStat[];
};

type Check = { date: string; questions: { n: number; skillId: string }[]; results: SheetResult[] };

const rate = (xs: boolean[]) => (xs.length ? xs.filter(Boolean).length / xs.length : 0);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Compares the first two attempts with the last two:
 * better → growing, worse → declining, equal and perfect → mastered, otherwise struggling.
 */
export function classifyTrend(attempts: boolean[]): SkillTrend {
  const window = Math.min(2, Math.floor(attempts.length / 2)) || 1;
  const earlier = rate(attempts.slice(0, window));
  const recent = rate(attempts.slice(-window));
  if (recent > earlier) return "growing";
  if (recent < earlier) return "declining";
  return recent === 1 ? "mastered" : "struggling";
}

export function buildChecks(history: HistoryCheck[], worksheet: Worksheet, latest: { date: string; results: SheetResult[] }): Check[] {
  return [
    ...history.map((h) => ({ date: h.date, questions: h.questions, results: h.results })),
    { date: latest.date, questions: worksheet.questions, results: latest.results },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export function studentStats(studentId: string, checks: Check[]): StudentStats {
  const points: CheckPoint[] = [];
  const attemptsBySkill = new Map<string, boolean[]>();

  for (const check of checks) {
    const mine = check.results.find((r) => r.studentId === studentId);
    if (!mine) continue;
    points.push({ date: check.date, score: mine.score, classAverage: mean(check.results.map((r) => r.score)) });
    for (const q of check.questions) {
      const answer = mine.answers.find((a) => a.n === q.n);
      if (!answer) continue;
      attemptsBySkill.set(q.skillId, [...(attemptsBySkill.get(q.skillId) ?? []), answer.correct]);
    }
  }

  const skills = SKILLS.filter((s) => attemptsBySkill.has(s.id)).map<SkillStat>((s) => {
    const attempts = attemptsBySkill.get(s.id)!;
    return { skillId: s.id, name: skillName(s.id), attempts, trend: classifyTrend(attempts) };
  });

  const scores = points.map((p) => p.score);
  return {
    points,
    monthAverage: mean(scores),
    delta: scores.length >= 2 ? mean(scores.slice(-2)) - mean(scores.slice(0, 2)) : 0,
    skills,
  };
}

/** "Har xil maxrajli kasrlarni qo'shish" -> "har xil maxrajli kasrlarni qo'shishda" */
function locative(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1) + "da";
}

function joinUz(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} va ${items.at(-1)}`;
}

/**
 * One-sentence conclusion: where the student makes mistakes and where they don't.
 * `person` switches between talking about the student and talking to them.
 */
export function conclusion(
  stats: StudentStats,
  firstName: string,
  person: "third" | "second",
  locale: "uz" | "ru" = "uz",
): string {
  const lastCorrect = (s: SkillStat) => s.attempts.at(-1) === true;
  if (locale === "ru") return conclusionRu(stats, firstName, person === "second", lastCorrect);
  const ok = stats.skills.filter(lastCorrect).map((s) => locative(s.name));
  const bad = stats.skills.filter((s) => !lastCorrect(s)).map((s) => locative(s.name));
  const you = person === "second";

  if (!bad.length) return you ? "Siz barcha mavzularda xatosiz ishlayapsiz." : `${firstName} barcha mavzularda xatosiz ishlayapti.`;
  if (!ok.length)
    return you
      ? `Siz ${joinUz(bad)} xato qilyapsiz — shu mavzularni takrorlaymiz.`
      : `${firstName} ${joinUz(bad)} xato qilyapti — shu mavzularni takrorlash kerak.`;
  // Mistakes lead — they are what to act on. A long list of good topics collapses.
  const okPart = ok.length <= 2 ? joinUz(ok) : "qolgan mavzularda";
  return you
    ? `Siz ${joinUz(bad)} hali xato qilyapsiz, ${okPart} esa xato yo'q.`
    : `${firstName} ${joinUz(bad)} hali xato qilyapti, ${okPart} esa xato yo'q.`;
}

/** Russian has no locative suffix trick, so topics are quoted: «Сокращение дробей». */
function conclusionRu(stats: StudentStats, firstName: string, you: boolean, lastCorrect: (s: SkillStat) => boolean) {
  const quote = (s: SkillStat) => `«${skillName(s.skillId, "ru")}»`;
  const ok = stats.skills.filter(lastCorrect).map(quote);
  const bad = stats.skills.filter((s) => !lastCorrect(s)).map(quote);
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} и ${xs.at(-1)}`);

  if (!bad.length) return you ? "Вы решаете без ошибок по всем темам." : `${firstName} решает без ошибок по всем темам.`;
  const topics = bad.length === 1 ? "теме" : "темах";
  if (!ok.length)
    return you
      ? `Вы ошибаетесь в ${topics} ${list(bad)} — повторим их.`
      : `${firstName} ошибается в ${topics} ${list(bad)} — их нужно повторить.`;
  const okPart = ok.length <= 2 ? `в ${ok.length === 1 ? "теме" : "темах"} ${list(ok)}` : "в остальных темах";
  return you
    ? `Вы пока ошибаетесь в ${topics} ${list(bad)}, а ${okPart} ошибок нет.`
    : `${firstName} пока ошибается в ${topics} ${list(bad)}, а ${okPart} ошибок нет.`;
}
