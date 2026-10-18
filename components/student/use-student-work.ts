"use client";

import { useEffect, useState } from "react";
import type { StudentSubmission } from "@/app/api/homework/route";
import type { Assessment, PublicQuestion } from "@/lib/types";

export type StudentAssessment = Omit<Assessment, "questions"> & { questions: PublicQuestion[] };

/** The student's submissions (with teacher grades) and the open assessments. */
export function useStudentWork(studentId: string) {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/homework?studentId=${studentId}`).then((r) => r.json() as Promise<{ submissions: StudentSubmission[] }>),
      fetch("/api/assessments?view=student").then((r) => r.json() as Promise<{ assessments: StudentAssessment[] }>),
    ])
      .then(([s, a]) => {
        if (cancelled) return;
        setSubmissions(s.submissions);
        setAssessments(a.assessments);
      })
      .catch(() => {
        // Home page still works from static data without these.
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return { submissions, assessments };
}
