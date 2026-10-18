import "server-only";
import assessmentsJson from "@/data/assessments.json";
import submissionsJson from "@/data/homework-submissions.json";
import { homework } from "@/lib/data";
import type { Assessment, HomeworkSubmission, PublicQuestion, Question } from "@/lib/types";

// In-memory state seeded from /data. Survives hot reloads in dev via globalThis.
// On serverless hosting it is per instance — acceptable for the demo (see README).

type Store = {
  submissions: Map<string, HomeworkSubmission>;
  assessments: Assessment[];
};

const key = (workId: string, studentId: string) => `${workId}:${studentId}`;

const globalStore = globalThis as typeof globalThis & { __daftarStore?: Store };

function store(): Store {
  globalStore.__daftarStore ??= {
    submissions: new Map(
      (submissionsJson as HomeworkSubmission[]).map((s) => [key(s.homeworkId, s.studentId), s]),
    ),
    assessments: structuredClone(assessmentsJson as Assessment[]),
  };
  return globalStore.__daftarStore;
}

export function listSubmissions(filter: { studentId?: string; workId?: string } = {}): HomeworkSubmission[] {
  return [...store().submissions.values()]
    .filter((s) => (!filter.studentId || s.studentId === filter.studentId) && (!filter.workId || s.homeworkId === filter.workId))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function saveSubmission(submission: HomeworkSubmission) {
  store().submissions.set(key(submission.homeworkId, submission.studentId), submission);
}

export function setTeacherGrade(workId: string, studentId: string, grade: number): HomeworkSubmission | null {
  const existing = store().submissions.get(key(workId, studentId));
  if (!existing) return null;
  const updated = { ...existing, teacherGrade: grade };
  store().submissions.set(key(workId, studentId), updated);
  return updated;
}

export function listAssessments(): Assessment[] {
  return [...store().assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addAssessment(a: Assessment) {
  store().assessments.push(a);
}

export function updateAssessment(id: string, patch: Partial<Pick<Assessment, "examMode">>): Assessment | null {
  const a = store().assessments.find((x) => x.id === id);
  if (!a) return null;
  Object.assign(a, patch);
  return a;
}

/** Any gradable work: today's homework or an assessment. Includes answers — server use only. */
export type Work = { id: string; title: string; questions: Question[]; examMode: boolean; kind: "homework" | "assessment" };

export function findWork(id: string): Work | null {
  if (id === homework.id) {
    return { id, title: homework.topic, questions: homework.questions, examMode: false, kind: "homework" };
  }
  const a = store().assessments.find((x) => x.id === id);
  return a ? { id, title: a.title, questions: a.questions, examMode: a.examMode, kind: "assessment" } : null;
}

export function toPublic(questions: Question[]): PublicQuestion[] {
  return questions.map(({ n, text, textRu, skillId }) => ({ n, text, textRu, skillId }));
}
