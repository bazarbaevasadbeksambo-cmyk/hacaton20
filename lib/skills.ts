import type { Question } from "./types.ts";
import { isCorrect } from "./fractions.ts";

type LocalizedSkill = { id: string; name: string; nameRu: string };

export const SKILLS: LocalizedSkill[] = [
  { id: "kasr-qoshish-bir-xil", name: "Bir xil maxrajli kasrlarni qo'shish", nameRu: "Сложение дробей с одинаковыми знаменателями" },
  { id: "kasr-qoshish-har-xil", name: "Har xil maxrajli kasrlarni qo'shish", nameRu: "Сложение дробей с разными знаменателями" },
  { id: "kasr-qisqartirish", name: "Kasrlarni qisqartirish", nameRu: "Сокращение дробей" },
  { id: "kasr-taqqoslash", name: "Kasrlarni taqqoslash", nameRu: "Сравнение дробей" },
  { id: "aralash-son", name: "Noto'g'ri kasrni aralash songa aylantirish", nameRu: "Перевод неправильной дроби в смешанное число" },
];

/** Skills where the written form of the answer is what's being tested. */
const EXACT_FORM_SKILLS = new Set(["kasr-qisqartirish", "aralash-son"]);

const skillById = new Map(SKILLS.map((s) => [s.id, s]));

/** Skill name in Uzbek (default — also used in AI prompts) or Russian. */
export function skillName(id: string | null | undefined, locale: "uz" | "ru" = "uz"): string {
  const skill = id ? skillById.get(id) : undefined;
  if (!skill) return locale === "ru" ? "Неизвестная тема" : "Noma'lum mavzu";
  return locale === "ru" ? skill.nameRu : skill.name;
}

export function checkAnswer(read: string, question: Question): boolean {
  return isCorrect(read, question.answer, EXACT_FORM_SKILLS.has(question.skillId));
}
