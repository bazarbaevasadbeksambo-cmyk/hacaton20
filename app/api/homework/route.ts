import { z } from "zod";
import { getStudent } from "@/lib/data";
import { findWork, listSubmissions, saveSubmission } from "@/lib/server/store";
import { checkAnswer } from "@/lib/skills";
import type { HomeworkSubmission } from "@/lib/types";

const BodySchema = z.object({
  homeworkId: z.string(),
  studentId: z.string(),
  answers: z.array(z.object({ n: z.number(), read: z.string().max(40) })),
  leftPageCount: z.number().int().min(0).max(1000),
  examMode: z.boolean(),
  focusSummary: z.object({ episodes: z.number().int().min(0), totalSeconds: z.number().min(0) }).optional(),
});

/** Students never receive the right answers — only which of theirs were wrong. */
export type StudentSubmission = Omit<HomeworkSubmission, "answers"> & {
  answers: { n: number; read: string; correct: boolean }[];
};

const forStudent = ({ answers, ...rest }: HomeworkSubmission): StudentSubmission => ({
  ...rest,
  answers: answers.map(({ n, read, correct }) => ({ n, read, correct })),
});

// GET ?studentId=… — one student's submissions; no params — all (teacher view).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const workId = searchParams.get("workId") ?? undefined;
  return Response.json({ submissions: listSubmissions({ studentId, workId }) });
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const body = parsed.data;
  const work = findWork(body.homeworkId);
  if (!work || !getStudent(body.studentId)) {
    return Response.json({ error: "Vazifa yoki o'quvchi topilmadi" }, { status: 404 });
  }

  // Checked in code against the server-side answers.
  const answers = work.questions.map((q) => {
    const read = body.answers.find((a) => a.n === q.n)?.read.trim() ?? "";
    return { n: q.n, read, correct: read !== "" && checkAnswer(read, q), confidence: 1 };
  });

  const submission: HomeworkSubmission = {
    studentId: body.studentId,
    homeworkId: work.id,
    answers,
    score: answers.filter((a) => a.correct).length,
    leftPageCount: body.leftPageCount,
    submittedAt: new Date().toISOString(),
    // Exam mode only counts for assessments where the teacher enabled it.
    examMode: work.examMode && body.examMode,
    focusSummary: work.examMode && body.examMode ? body.focusSummary : undefined,
  };
  saveSubmission(submission);
  return Response.json({ submission: forStudent(submission) });
}
