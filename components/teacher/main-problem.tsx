"use client";

import { Card, CardLabel } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { QuestionStat } from "@/lib/analysis";
import { questionText } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";
import { skillName } from "@/lib/skills";
import type { Question } from "@/lib/types";

type MainProblemProps = {
  stat: QuestionStat;
  question: Question;
  total: number;
  /** What the most common wrong answer reveals, if known. */
  misconception?: string;
};

export function MainProblem({ stat, question, total, misconception }: MainProblemProps) {
  const t = useT();
  const locale = useLocale();
  const share = Math.round((stat.wrong / total) * 100);

  return (
    <Card data-anim="problem" className="border-l-4 border-l-wrong">
      <CardLabel className="mb-3 text-wrong">{t.cls.mainProblem}</CardLabel>
      <h2 className="mb-6 text-xl font-semibold leading-snug sm:text-3xl">{skillName(stat.skillId, locale)}</h2>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-10">
        <div>
          <p className="font-display text-5xl font-semibold leading-none text-wrong tabular-nums sm:text-6xl">
            {stat.wrong}
            <span className="text-2xl text-ink-soft sm:text-3xl"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-ink-soft">{t.cls.wrongOn(stat.n)}</p>
          <Progress value={share} className="mt-3 w-48 [&>div]:bg-wrong" label={t.cls.wrongShare(share)} />
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <dt className="text-ink-soft">{t.cls.question}</dt>
            <dd className="font-semibold">
              {questionText(question, locale)} <span className="text-correct">→ {question.answer}</span>
            </dd>
          </div>
          {stat.topWrong && (
            <div className="flex flex-wrap items-baseline gap-x-3">
              <dt className="text-ink-soft">{t.cls.commonMistake}</dt>
              <dd>
                <span className="font-semibold text-wrong line-through decoration-2">{stat.topWrong.read}</span>
                <span className="text-ink-soft"> — {t.cls.studentsCount(stat.topWrong.count)}</span>
                {misconception && <span className="mt-1 block text-ink">{misconception}</span>}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </Card>
  );
}
