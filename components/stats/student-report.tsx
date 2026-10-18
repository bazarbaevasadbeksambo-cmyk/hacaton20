"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { ScoreChart } from "./score-chart";
import { history, worksheet } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { useLatestCheck } from "@/lib/results-store";
import { buildChecks, conclusion, studentStats, type SkillStat, type SkillTrend } from "@/lib/stats";
import { skillName } from "@/lib/skills";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/locale";
import type { Dict } from "@/lib/i18n/dict";

type StudentReportProps = {
  student: Student;
  /** "teacher" talks about the student, "student" talks to them. */
  audience: "teacher" | "student";
};

const lists = (t: Dict): { trend: SkillTrend; title: string; tone: string; empty: string }[] => [
  { trend: "mastered", title: t.report.mastered, tone: "text-correct", empty: t.report.none },
  { trend: "declining", title: t.report.declining, tone: "text-wrong", empty: t.report.noneDeclining },
  { trend: "growing", title: t.report.growing, tone: "text-accent", empty: t.report.none },
];

export function StudentReport({ student, audience }: StudentReportProps) {
  const t = useT();
  const locale = useLocale();
  const latest = useLatestCheck();
  const stats = useMemo(
    () => studentStats(student.id, buildChecks(history, worksheet, latest)),
    [student.id, latest],
  );
  const firstName = student.name.split(" ")[0];
  const maxScore = worksheet.questions.length;
  const summary = conclusion(stats, firstName, audience === "student" ? "second" : "third", locale);

  const TrendIcon = stats.delta > 0.25 ? TrendingUp : stats.delta < -0.25 ? TrendingDown : Minus;
  const trendText = stats.delta > 0.25 ? t.report.up : stats.delta < -0.25 ? t.report.down : t.report.flat;
  const trendTone = stats.delta > 0.25 ? "text-correct" : stats.delta < -0.25 ? "text-wrong" : "text-ink-soft";

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-l-4 border-l-accent">
        <CardLabel className="mb-2">{t.report.summary}</CardLabel>
        <p className="text-base font-semibold leading-relaxed sm:text-lg">{summary}</p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <CardLabel className="mb-1">{t.report.monthAvg}</CardLabel>
            <p className="font-display text-3xl font-semibold tabular-nums">
              {formatScore(stats.monthAverage)}
              <span className="text-base text-ink-soft"> / {maxScore}</span>
            </p>
          </div>
          <p className={cn("flex items-center gap-1.5 text-sm font-semibold", trendTone)}>
            <TrendIcon className="size-4" aria-hidden />
            {trendText}
            {Math.abs(stats.delta) > 0.25 && (
              <span className="tabular-nums">
                ({stats.delta > 0 ? "+" : "−"}
                {formatScore(Math.abs(stats.delta))})
              </span>
            )}
          </p>
        </div>
        <ScoreChart points={stats.points} maxScore={maxScore} studentLabel={audience === "student" ? t.report.you : firstName} />
        <ul className="mt-3 flex gap-4 text-xs text-ink-soft">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-accent" aria-hidden />
            {audience === "student" ? t.report.yourScore : firstName}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 border-t-2 border-dashed border-ink-soft" aria-hidden />
            {t.report.classAvg}
          </li>
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {lists(t).map((list) => (
          <SkillList key={list.trend} {...list} skills={stats.skills.filter((s) => s.trend === list.trend)} />
        ))}
      </div>
    </div>
  );
}

function SkillList({ title, tone, empty, skills }: { title: string; tone: string; empty: string; skills: SkillStat[] }) {
  const locale = useLocale();
  return (
    <Card>
      <CardLabel className={cn("mb-3", tone)}>
        {title} · {skills.length}
      </CardLabel>
      {skills.length === 0 ? (
        <p className="text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {skills.map((s) => (
            <li key={s.skillId}>
              <p className="mb-1.5 text-sm font-semibold leading-snug">{skillName(s.skillId, locale)}</p>
              <AttemptDots attempts={s.attempts} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Chronological row of results for one skill: filled = correct, red = mistake. */
function AttemptDots({ attempts }: { attempts: boolean[] }) {
  const t = useT();
  return (
    <ol className="flex gap-1" aria-label={t.report.correctOf(attempts.filter(Boolean).length, attempts.length)}>
      {attempts.map((ok, i) => (
        <li key={i} className={cn("h-2 w-6 rounded-full", ok ? "bg-correct" : "bg-wrong")} />
      ))}
    </ol>
  );
}
