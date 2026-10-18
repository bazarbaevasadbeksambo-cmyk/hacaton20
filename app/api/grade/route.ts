import { z } from "zod";
import { readSheet } from "@/lib/ai/grade";
import { demoResults, worksheet } from "@/lib/data";
import { aiEnabled } from "@/lib/env";
import { checkAnswer } from "@/lib/skills";
import type { SheetResult } from "@/lib/types";

const BodySchema = z.object({
  // Optional only for demo-mode sample sheets; real checking requires a photo.
  image: z
    .string()
    .regex(/^data:image\/(jpeg|png);base64,/)
    .optional(),
  worksheetId: z.string(),
  studentId: z.string(),
});

export type GradeResponse = { result: SheetResult; source: "ai" | "demo" };

function demoResult(studentId: string): SheetResult | undefined {
  return demoResults.results.find((r) => r.studentId === studentId);
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const { image, studentId } = parsed.data;
  const fallback = demoResult(studentId);

  if (!aiEnabled()) {
    if (!fallback) return Response.json({ error: "O'quvchi topilmadi" }, { status: 404 });
    // Small pause so the demo progress bar reads like real checking.
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
    return Response.json({ result: fallback, source: "demo" } satisfies GradeResponse);
  }

  if (!image) return Response.json({ error: "Rasm yuborilmadi" }, { status: 400 });
  const [, mediaType, data] = image.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/)!;
  const reads = await readSheet(data, mediaType as "image/jpeg" | "image/png", worksheet.questions.length);

  if (!reads) {
    if (!fallback) return Response.json({ error: "Varaqni o'qib bo'lmadi" }, { status: 502 });
    return Response.json({ result: fallback, source: "demo" } satisfies GradeResponse);
  }

  const answers = worksheet.questions.map((q) => {
    const r = reads.find((x) => x.n === q.n)!;
    return { n: q.n, read: r.read, correct: r.read !== "" && checkAnswer(r.read, q), confidence: r.confidence };
  });
  const result: SheetResult = {
    worksheetId: worksheet.id,
    studentId,
    date: demoResults.date,
    answers,
    score: answers.filter((a) => a.correct).length,
  };
  return Response.json({ result, source: "ai" } satisfies GradeResponse);
}
