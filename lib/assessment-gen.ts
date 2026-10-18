// Generates assessment variants in code: numbers are random, answers are computed,
// so every variant is correct by construction and needs no AI.

import { formatFraction, reduce } from "./fractions";
import { SKILLS, skillName } from "./skills";
import type { Assessment, AssessmentKind, Question } from "./types";

const int = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(xs: T[]) => xs[int(0, xs.length - 1)];

type Make = () => Omit<Question, "n" | "skillId">;

const GENERATORS: Record<string, Make> = {
  "kasr-qoshish-bir-xil": () => {
    const d = pick([7, 9, 11, 12, 13, 15]);
    const a = int(1, d - 3);
    const b = int(1, d - a - 1);
    return { text: `${a}/${d} + ${b}/${d} = ?`, answer: formatFraction(reduce({ num: a + b, den: d })) };
  },
  "kasr-qoshish-har-xil": () => {
    const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [6, 8]]);
    const a = int(1, d1 - 1);
    const b = int(1, d2 - 1);
    return { text: `${a}/${d1} + ${b}/${d2} = ?`, answer: formatFraction(reduce({ num: a * d2 + b * d1, den: d1 * d2 })) };
  },
  "kasr-qisqartirish": () => {
    const [n, d] = pick([[2, 3], [3, 4], [3, 5], [4, 7], [5, 6], [2, 7]]);
    const k = int(2, 6);
    return {
      text: `${n * k}/${d * k} kasrni qisqartiring`,
      textRu: `Сократите дробь ${n * k}/${d * k}`,
      answer: `${n}/${d}`,
    };
  },
  "kasr-taqqoslash": () => {
    let a: number, b: number, c: number, d: number;
    do {
      [a, b, c, d] = [int(1, 8), int(2, 9), int(1, 8), int(2, 9)];
    } while (a >= b || c >= d || a * d === c * b);
    return {
      text: `${a}/${b} va ${c}/${d} ni taqqoslang (>, < yoki =)`,
      textRu: `Сравните ${a}/${b} и ${c}/${d} (>, < или =)`,
      answer: a * d > c * b ? ">" : "<",
    };
  },
  "aralash-son": () => {
    const d = int(3, 9);
    const whole = int(1, 5);
    // The fractional part must already be in lowest terms, or the expected answer is itself unreduced.
    let r = int(1, d - 1);
    while (reduce({ num: r, den: d }).den !== d) r = int(1, d - 1);
    return {
      text: `${whole * d + r}/${d} ni aralash son ko'rinishida yozing`,
      textRu: `Запишите ${whole * d + r}/${d} смешанным числом`,
      answer: `${whole} ${r}/${d}`,
    };
  },
};

export function generateAssessment(kind: AssessmentKind, skillId: string | null): Assessment {
  // BSB: five tasks on one topic. ChSB: one task per topic across the quarter.
  const skillIds = kind === "BSB" && skillId ? Array(5).fill(skillId) : SKILLS.map((s) => s.id);
  const seen = new Set<string>();
  const questions = skillIds.map((id, i): Question => {
    let q = GENERATORS[id]();
    for (let tries = 0; seen.has(q.text) && tries < 10; tries++) q = GENERATORS[id]();
    seen.add(q.text);
    return { n: i + 1, skillId: id, ...q };
  });

  return {
    id: `as-${Date.now().toString(36)}`,
    kind,
    title: kind === "BSB" && skillId ? `BSB: ${skillName(skillId)}` : "ChSB: Kasrlar (1-chorak)",
    skillId: kind === "BSB" ? skillId : null,
    createdAt: new Date().toISOString(),
    questions,
    examMode: false,
  };
}
