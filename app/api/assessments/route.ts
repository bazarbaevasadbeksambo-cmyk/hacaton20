import { z } from "zod";
import { generateAssessment } from "@/lib/assessment-gen";
import { addAssessment, listAssessments, toPublic, updateAssessment } from "@/lib/server/store";
import { SKILLS } from "@/lib/skills";

const CreateSchema = z.object({
  kind: z.enum(["BSB", "ChSB"]),
  skillId: z.enum(SKILLS.map((s) => s.id) as [string, ...string[]]).nullable(),
});
const PatchSchema = z.object({ id: z.string(), examMode: z.boolean() });

// GET — teacher view with answers; GET ?view=student — questions only, never answers.
export async function GET(request: Request) {
  const studentView = new URL(request.url).searchParams.get("view") === "student";
  const assessments = listAssessments();
  return Response.json({
    assessments: studentView ? assessments.map((a) => ({ ...a, questions: toPublic(a.questions) })) : assessments,
  });
}

export async function POST(request: Request) {
  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.kind === "BSB" && !parsed.data.skillId)) {
    return Response.json({ error: "Mavzuni tanlang" }, { status: 400 });
  }
  const assessment = generateAssessment(parsed.data.kind, parsed.data.skillId);
  addAssessment(assessment);
  return Response.json({ assessment });
}

export async function PATCH(request: Request) {
  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  const assessment = updateAssessment(parsed.data.id, { examMode: parsed.data.examMode });
  if (!assessment) return Response.json({ error: "Topilmadi" }, { status: 404 });
  return Response.json({ assessment });
}
