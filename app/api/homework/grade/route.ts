import { z } from "zod";
import { setTeacherGrade } from "@/lib/server/store";

const BodySchema = z.object({
  homeworkId: z.string(),
  studentId: z.string(),
  grade: z.number().int().min(2).max(5),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const { homeworkId, studentId, grade } = parsed.data;
  const submission = setTeacherGrade(homeworkId, studentId, grade);
  if (!submission) return Response.json({ error: "Topshiriq topilmadi" }, { status: 404 });
  return Response.json({ submission });
}
