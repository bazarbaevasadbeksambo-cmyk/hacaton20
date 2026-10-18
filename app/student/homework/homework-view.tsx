"use client";

import { WorkSolver } from "@/components/student/work-solver";
import { tr } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";
import type { PublicQuestion } from "@/lib/types";

type HomeworkViewProps = {
  id: string;
  subject: string;
  topic: string;
  lessonNumber: number | null;
  questions: PublicQuestion[];
};

export function HomeworkView({ id, subject, topic, lessonNumber, questions }: HomeworkViewProps) {
  const t = useT();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm text-ink-soft">{t.solver.todayLesson(tr(subject, locale), lessonNumber)}</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{tr(topic, locale)}</h1>
      </header>
      <WorkSolver work={{ id, title: topic, label: t.nav.student.homework[0], questions, examMode: false }} />
    </div>
  );
}
