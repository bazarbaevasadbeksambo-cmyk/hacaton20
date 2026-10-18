"use client";

import { Card, CardLabel } from "@/components/ui/card";
import { worksheet } from "@/lib/data";
import { formatDay } from "@/lib/format";
import { isUnsure } from "@/lib/analysis";
import { tr } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";
import { useLatestCheck } from "@/lib/results-store";
import { skillName } from "@/lib/skills";
import { cn } from "@/lib/utils";

/** The student's sheet from the latest check: what was read in each box, per topic. */
export function TodayAnswers({ studentId }: { studentId: string }) {
  const t = useT();
  const locale = useLocale();
  const latest = useLatestCheck();
  const result = latest.results.find((r) => r.studentId === studentId);
  if (!result) return null;

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <CardLabel>
          {t.report.lastCheck} · {formatDay(latest.date, locale)} · {tr(worksheet.topic, locale)}
        </CardLabel>
        <p className="font-display text-lg font-semibold tabular-nums">
          {result.score}/{worksheet.questions.length}
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-5">
        {worksheet.questions.map((q) => {
          const a = result.answers.find((x) => x.n === q.n);
          const unsure = a && isUnsure(a.confidence);
          return (
            <li
              key={q.n}
              className={cn(
                "flex items-center gap-3 rounded-[12px] border p-3 sm:flex-col sm:items-start sm:gap-1",
                unsure ? "border-unsure bg-unsure-soft" : a?.correct ? "border-grid" : "border-wrong/40 bg-wrong-soft",
              )}
            >
              <span className="font-display text-sm font-semibold text-ink-soft">{q.n}</span>
              <span
                className={cn(
                  "min-w-16 whitespace-nowrap font-display text-lg font-semibold tabular-nums",
                  a?.correct ? "text-correct" : "text-wrong",
                )}
              >
                {a?.read ?? "—"}
              </span>
              <span className="text-xs leading-snug text-ink-soft">
                {unsure ? `${t.heatmap.unsure} · ` : ""}
                {skillName(q.skillId, locale)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
