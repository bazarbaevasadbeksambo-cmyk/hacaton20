import { z } from "zod";
import { writeGroupTasks, writeParentMessages } from "@/lib/ai/groups";
import { buildGroups, summarizeClass } from "@/lib/analysis";
import { groupTasksByLocale, students, worksheet } from "@/lib/data";
import { aiEnabled } from "@/lib/env";
import { fallbackParentMessage, recipientsFor } from "@/lib/parent-messages";
import type { Group, ParentMessage, SheetResult } from "@/lib/types";

const ResultSchema = z.object({
  worksheetId: z.string(),
  studentId: z.string(),
  date: z.string(),
  score: z.number(),
  answers: z.array(z.object({ n: z.number(), read: z.string(), correct: z.boolean(), confidence: z.number() })),
});
const BodySchema = z.object({
  results: z.array(ResultSchema).min(1),
  /** Language of the teacher's UI for group tasks; parent messages stay Uzbek. */
  locale: z.enum(["uz", "ru"]).default("uz"),
});

export type GroupsResponse = { groups: Group[]; parentMessages: ParentMessage[]; source: "ai" | "demo" };

// Groups are decided in code; the AI only writes the task texts and parent messages.
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const results: SheetResult[] = parsed.data.results;
  const { locale } = parsed.data;
  const summary = summarizeClass(worksheet, results);
  const groups = buildGroups(summary, results, students, groupTasksByLocale[locale]);
  const recipients = recipientsFor(groups, results);

  if (!aiEnabled()) {
    return Response.json({
      groups,
      parentMessages: recipients.map(fallbackParentMessage),
      source: "demo",
    } satisfies GroupsResponse);
  }

  const [tasks, messages] = await Promise.all([writeGroupTasks(groups, locale), writeParentMessages(recipients)]);

  // Anything the AI did not deliver falls back to the prepared texts, per item.
  return Response.json({
    groups: groups.map((g) => ({ ...g, task: tasks?.get(g.id) ?? g.task })),
    parentMessages: recipients.map((r) =>
      messages.has(r.studentId) ? { studentId: r.studentId, text: messages.get(r.studentId)! } : fallbackParentMessage(r),
    ),
    source: tasks || messages.size ? "ai" : "demo",
  } satisfies GroupsResponse);
}
