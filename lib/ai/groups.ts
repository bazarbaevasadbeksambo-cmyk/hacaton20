import "server-only";
import { z } from "zod";
import { askJson } from "./client";
import { students, worksheet } from "@/lib/data";
import type { Recipient } from "@/lib/parent-messages";
import { skillName } from "@/lib/skills";
import type { Group } from "@/lib/types";

const TasksSchema = z.strictObject({
  tasks: z.array(z.strictObject({ groupId: z.string(), task: z.string() })),
});

const MessagesSchema = z.strictObject({
  messages: z.array(z.strictObject({ studentId: z.string(), text: z.string() })),
});

const TASKS_SYSTEM = `You are an experienced 6th-grade math teacher in Uzbekistan. Write in Uzbek (Latin script).
For each group write a mini-task for tomorrow: one short instruction line, then exactly 3 numbered exercises ("1) ...") on that group's topic, from easy to harder.
Use plain-text fractions like 3/4 and mixed numbers like 2 1/3. No answers, no markdown, no emoji.
The group without a topic made no mistakes on the key topics: give them 3 harder fraction exercises (mixed numbers, a short word problem).`;

const MESSAGES_SYSTEM = `You write short Telegram messages from a math teacher to parents of 6th-grade students in Uzbekistan.
Language: simple, warm Uzbek (Latin script) that any parent understands. 3–5 sentences, under 450 characters.
Each message: what went well, which topic is still hard (in plain words), one concrete 10-minute activity to do at home together, and a calm, encouraging closing.
Never blame or compare the child with others. No greeting line with the child's name (it is added automatically), no signature, no markdown, no emoji.`;

const CHUNK = 8;

export async function writeGroupTasks(groups: Group[], locale: "uz" | "ru" = "uz"): Promise<Map<string, string> | null> {
  const brief = groups.map((g) => ({
    groupId: g.id,
    topic: g.skillId ? skillName(g.skillId) : "Xatosiz — murakkabroq topshiriq",
    students: g.studentIds.length,
  }));
  const result = await askJson({
    schema: TasksSchema,
    system:
      locale === "ru"
        ? TASKS_SYSTEM.replace("Write in Uzbek (Latin script).", "Write in Russian.")
        : TASKS_SYSTEM,
    content: [{ type: "text", text: `Worksheet topic: ${worksheet.topic}.\nGroups:\n${JSON.stringify(brief, null, 2)}` }],
  });
  if (!result) return null;
  return new Map(result.tasks.filter((t) => t.task.trim()).map((t) => [t.groupId, t.task.trim()]));
}

/** Messages are written in parallel chunks so a full class stays fast. */
export async function writeParentMessages(recipients: Recipient[]): Promise<Map<string, string>> {
  const chunks = Array.from({ length: Math.ceil(recipients.length / CHUNK) }, (_, i) =>
    recipients.slice(i * CHUNK, (i + 1) * CHUNK),
  );
  const written = new Map<string, string>();

  await Promise.all(
    chunks.map(async (chunk) => {
      const brief = chunk.map((r) => ({
        studentId: r.studentId,
        firstName: students.find((s) => s.id === r.studentId)?.name.split(" ")[0],
        correct: `${r.score} / ${worksheet.questions.length}`,
        hardTopic: skillName(r.skillId),
      }));
      const result = await askJson({
        schema: MessagesSchema,
        system: MESSAGES_SYSTEM,
        content: [
          {
            type: "text",
            text: `Today's check: "${worksheet.topic}". Write one message per student:\n${JSON.stringify(brief, null, 2)}`,
          },
        ],
      });
      result?.messages.forEach((m) => {
        if (chunk.some((r) => r.studentId === m.studentId) && m.text.trim()) written.set(m.studentId, m.text.trim());
      });
    }),
  );
  return written;
}
