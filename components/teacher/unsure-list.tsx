"use client";

import { Card, CardLabel } from "@/components/ui/card";
import { isUnsure } from "@/lib/analysis";
import { useT } from "@/lib/i18n/locale";
import type { SheetResult, Student } from "@/lib/types";

type UnsureListProps = { results: SheetResult[]; students: Student[] };

/** Answers the reader was not sure about — the teacher should glance at the paper. */
export function UnsureList({ results, students }: UnsureListProps) {
  const t = useT();
  const items = results.flatMap((r) =>
    r.answers.filter((a) => isUnsure(a.confidence)).map((a) => ({ result: r, answer: a })),
  );
  if (!items.length) return null;

  return (
    <Card className="border-unsure/60">
      <CardLabel className="mb-3 text-unsure-ink">{t.cls.checkThese(items.length)}</CardLabel>
      <ul className="divide-y divide-grid text-sm">
        {items.map(({ result, answer }) => {
          const student = students.find((s) => s.id === result.studentId);
          return (
            <li key={`${result.studentId}-${answer.n}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2">
              <span className="font-semibold">
                {student?.number}. {student?.name}
              </span>
              <span className="text-ink-soft">
                {t.cls.nthQuestion(answer.n)} · {t.cls.read}: <span className="font-semibold text-ink">{answer.read}</span> ·{" "}
                {Math.round(answer.confidence * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
