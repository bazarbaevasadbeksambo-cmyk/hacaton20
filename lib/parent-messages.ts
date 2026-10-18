// Parent messages: who gets one, the offline fallback text, and the Telegram wrapper.

import { parentTips, students, teacher, worksheet } from "./data";
import { skillName } from "./skills";
import type { Group, ParentMessage, SheetResult } from "./types";

export type Recipient = { studentId: string; skillId: string; score: number };

/** Parents of students in a problem group (groups with a skill) get a message. */
export function recipientsFor(groups: Group[], results: SheetResult[]): Recipient[] {
  return groups
    .filter((g): g is Group & { skillId: string } => g.skillId !== null)
    .flatMap((g) =>
      g.studentIds.map((studentId) => ({
        studentId,
        skillId: g.skillId,
        score: results.find((r) => r.studentId === studentId)?.score ?? 0,
      })),
    );
}

export function fallbackParentMessage({ studentId, skillId, score }: Recipient): ParentMessage {
  const name = students.find((s) => s.id === studentId)?.name.split(" ")[0] ?? "Farzandingiz";
  const text =
    `Bugungi tekshiruvda ${name} ${worksheet.questions.length} ta savoldan ${score} tasiga to'g'ri javob berdi. ` +
    `Hozircha qiyinroq bo'lgan mavzu: ${skillName(skillId).toLowerCase()}.\n\n` +
    `Uyda 10 daqiqa: ${parentTips.uz[skillId] ?? "kun davomida birga 2–3 ta misol yeching."}\n\n` +
    `Ertaga darsda shu mavzuni alohida takrorlaymiz. Yordamingiz uchun rahmat!`;
  return { studentId, text };
}

/** Final Telegram text: student and topic first, signature last. */
export function formatTelegramMessage(studentId: string, body: string): string {
  const student = students.find((s) => s.id === studentId);
  return `${student?.name ?? "O'quvchi"} · ${worksheet.topic}\n\n${body.trim()}\n\nDaftar · ${teacher.className} sinf`;
}
