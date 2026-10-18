"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { useCurrentStudent } from "@/components/student/current-student";
import type { StudentSubmission } from "@/app/api/homework/route";
import type { FocusSummary, PublicQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/locale";
import { questionText } from "@/lib/i18n/content";

export type SolvableWork = {
  id: string;
  title: string;
  label: string;
  questions: PublicQuestion[];
  examMode: boolean;
};

type WorkSolverProps = {
  work: SolvableWork;
  /** Exam-mode focus tracking, supplied by the exam wrapper; absent for ordinary homework. */
  focus?: { active: boolean; summary: () => FocusSummary };
  /** Called once the work is handed in (lets exam mode switch the camera off). */
  onSubmitted?: () => void;
};

/** Counts every time the student leaves the page (tab switch, app switch, window blur). */
function useLeaveCounter(enabled: boolean) {
  const [count, setCount] = useState(0);
  const [justReturned, setJustReturned] = useState(false);
  const away = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const leave = () => {
      if (away.current) return; // blur and visibilitychange fire together — count once
      away.current = true;
      setCount((c) => c + 1);
    };
    const back = () => {
      if (!away.current || document.hidden) return;
      away.current = false;
      setJustReturned(true);
    };
    const onVisibility = () => (document.hidden ? leave() : back());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, [enabled]);

  useEffect(() => {
    if (!justReturned) return;
    const t = window.setTimeout(() => setJustReturned(false), 4000);
    return () => window.clearTimeout(t);
  }, [justReturned]);

  return { count, justReturned };
}

export function WorkSolver({ work, focus, onSubmitted }: WorkSolverProps) {
  const t = useT();
  const locale = useLocale();
  const { student } = useCurrentStudent();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const leaves = useLeaveCounter(!loading && !submission);

  // Already handed in? Show the result instead of an empty form.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/homework?studentId=${student.id}&workId=${work.id}`)
      .then((r) => r.json() as Promise<{ submissions: StudentSubmission[] }>)
      .then(({ submissions }) => !cancelled && setSubmission(submissions[0] ?? null))
      .catch(() => !cancelled && setSubmission(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [student.id, work.id]);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkId: work.id,
          studentId: student.id,
          answers: work.questions.map((q) => ({ n: q.n, read: answers[q.n] ?? "" })),
          leftPageCount: leaves.count,
          examMode: Boolean(focus?.active),
          focusSummary: focus?.active ? focus.summary() : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmission(((await res.json()) as { submission: StudentSubmission }).submission);
      onSubmitted?.();
    } catch {
      setError(t.solver.sendError);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-[12px] bg-grid/40" aria-label={t.common.loading} />;

  if (submission) {
    return (
      <Card>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <CardLabel className="mb-1">{t.solver.result}</CardLabel>
            <p className="font-display text-4xl font-semibold tabular-nums">
              {submission.score}
              <span className="text-lg text-ink-soft"> / {work.questions.length}</span>
            </p>
          </div>
          {submission.teacherGrade && (
            <div className="text-right">
              <CardLabel className="mb-1">{t.solver.teacherGrade}</CardLabel>
              <p className="font-display text-4xl font-semibold text-accent">{submission.teacherGrade}</p>
            </div>
          )}
        </div>
        <ul className="flex flex-col gap-2">
          {work.questions.map((q) => {
            const a = submission.answers.find((x) => x.n === q.n);
            return (
              <li
                key={q.n}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] border px-3 py-2.5",
                  a?.correct ? "border-grid" : "border-wrong/40 bg-wrong-soft",
                )}
              >
                {a?.correct ? (
                  <Check className="size-4 shrink-0 text-correct" aria-label={t.solver.right} />
                ) : (
                  <X className="size-4 shrink-0 text-wrong" aria-label={t.solver.wrong} />
                )}
                <span className="flex-1 text-sm">
                  {q.n}. {questionText(q, locale)}
                </span>
                <span className={cn("font-display font-semibold", a?.correct ? "text-correct" : "text-wrong")}>
                  {a?.read || "—"}
                </span>
              </li>
            );
          })}
        </ul>
        {submission.answers.some((a) => !a.correct) && (
          <p className="mt-4 text-sm text-ink-soft">{t.solver.redRows}</p>
        )}
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-4"
    >
      <p className="flex items-center gap-2 rounded-[12px] border border-grid bg-surface px-4 py-3 text-sm text-ink-soft">
        <Eye className="size-4 shrink-0" aria-hidden />
        {t.solver.tracked}
        {leaves.count > 0 && <span className="ml-auto font-semibold text-wrong tabular-nums">{t.solver.times(leaves.count)}</span>}
      </p>

      {leaves.justReturned && (
        <p role="alert" className="rounded-[12px] bg-unsure-soft px-4 py-3 text-sm font-semibold text-unsure-ink">
          {t.solver.leftWarning}
        </p>
      )}

      <Card className="flex flex-col gap-4">
        {work.questions.map((q) => (
          <label key={q.n} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="flex-1 font-semibold">
              <span className="mr-2 font-display text-ink-soft">{q.n}</span>
              {questionText(q, locale)}
            </span>
            <input
              value={answers[q.n] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.n]: e.target.value }))}
              // A sample fraction here could read as a hint (or even the answer), so stay neutral.
              placeholder={q.text.includes("taqqoslang") ? "> < =" : t.solver.answer}
              autoComplete="off"
              className="h-12 w-full rounded-[12px] border-2 border-ink/80 bg-surface px-4 text-center font-display text-lg font-semibold focus:border-accent focus:outline-none sm:w-40"
            />
          </label>
        ))}
        <p className="text-xs text-ink-soft">{t.solver.hint}</p>
      </Card>

      {error && (
        <p role="alert" className="rounded-[12px] bg-wrong-soft px-4 py-3 text-sm font-semibold text-wrong">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto sm:self-end">
        <Send aria-hidden />
        {sending ? t.common.sending : t.common.send}
      </Button>
    </form>
  );
}
