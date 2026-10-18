"use client";

import { useEffect, useState } from "react";
import { WorkSolver, type SolvableWork } from "@/components/student/work-solver";
import { ExamGate } from "@/components/exam/exam-gate";
import type { StudentAssessment } from "@/components/student/use-student-work";
import { assessmentKind } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";
import { skillName } from "@/lib/skills";

export function AssessmentRunner({ id }: { id: string }) {
  const t = useT();
  const locale = useLocale();
  const [assessment, setAssessment] = useState<StudentAssessment | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/assessments?view=student")
      .then((r) => r.json() as Promise<{ assessments: StudentAssessment[] }>)
      .then(({ assessments }) => setAssessment(assessments.find((x) => x.id === id) ?? null))
      .catch(() => setAssessment(null));
  }, [id]);

  if (assessment === undefined) {
    return <div className="h-64 animate-pulse rounded-[12px] bg-grid/40" aria-label={t.common.loading} />;
  }
  if (assessment === null) return <p className="text-ink-soft">{t.solver.notFound}</p>;

  const title = assessment.skillId ? skillName(assessment.skillId, locale) : t.assessments.quarter;
  const work: SolvableWork = {
    id: assessment.id,
    title,
    label: assessmentKind(assessment.kind, locale),
    questions: assessment.questions,
    examMode: assessment.examMode,
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm text-ink-soft">
          {t.solver.assessment} · {work.label}
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      </header>
      {work.examMode ? <ExamGate work={work} /> : <WorkSolver work={work} />}
    </div>
  );
}
