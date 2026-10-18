import { z } from "zod";
import { askJson } from "@/lib/ai/client";
import { readingQuestions, readingTexts } from "@/lib/data";
import { aiEnabled } from "@/lib/env";

const BodySchema = z.object({ lang: z.enum(["uz", "ru", "en"]) });

const QuestionsSchema = z.strictObject({
  questions: z.array(z.strictObject({ question: z.string(), answer: z.string() })),
});

export type ReadingQuestionsResponse = { questions: { question: string; answer: string }[]; source: "ai" | "demo" };

const LANG_NAME = { uz: "Uzbek (Latin script)", ru: "Russian", en: "English" } as const;

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const { lang } = parsed.data;
  const text = readingTexts.find((t) => t.lang === lang)!;
  const fallback = { questions: readingQuestions[lang], source: "demo" } satisfies ReadingQuestionsResponse;
  if (!aiEnabled()) return Response.json(fallback);

  const result = await askJson({
    schema: QuestionsSchema,
    system: `You check reading comprehension of 12-year-old students. Write in ${LANG_NAME[lang]}.
Ask exactly 2 short questions answerable only from the text (one about a fact, one about meaning), each with a one-sentence model answer.`,
    content: [{ type: "text", text: `Text "${text.title}":\n${text.text}` }],
  });
  const questions = result?.questions.filter((q) => q.question.trim()).slice(0, 2);

  return Response.json(
    questions?.length === 2 ? ({ questions, source: "ai" } satisfies ReadingQuestionsResponse) : fallback,
  );
}
