import Link from "next/link";
import { cn } from "@/lib/utils";
import { shortName } from "@/lib/format";
import { useT } from "@/lib/i18n/locale";
import type { Dict } from "@/lib/i18n/dict";
import { isUnsure, type QuestionStat } from "@/lib/analysis";
import type { AnswerResult, SheetResult, Student, Worksheet } from "@/lib/types";

type HeatmapProps = {
  worksheet: Worksheet;
  results: SheetResult[];
  students: Student[];
  questionStats: QuestionStat[];
  highlightN?: number;
};

type CellState = "right" | "wrong" | "unsure";

function cellState(a: AnswerResult): CellState {
  if (isUnsure(a.confidence)) return "unsure";
  return a.correct ? "right" : "wrong";
}

// Right/wrong differ in lightness as well as hue: pale teal vs. solid red-pen.
const CELL_STYLES: Record<CellState, string> = {
  right: "bg-correct-soft text-correct",
  wrong: "bg-wrong text-white",
  unsure: "bg-unsure-soft text-unsure-ink ring-2 ring-inset ring-unsure",
};

const stateLabel = (t: Dict, s: CellState) => t.heatmap[s];

/** Student × question grid. Cells carry data-anim="cell" for the page's GSAP wave. */
export function Heatmap({ worksheet, results, students, questionStats, highlightN }: HeatmapProps) {
  const t = useT();
  const rows = [...results].sort(
    (a, b) => (students.find((s) => s.id === a.studentId)?.number ?? 0) - (students.find((s) => s.id === b.studentId)?.number ?? 0),
  );
  const cols = worksheet.questions.length;
  const gridStyle = { gridTemplateColumns: `minmax(0,1fr) repeat(${cols}, var(--cell)) 2rem` };

  return (
    <div className="[--cell:2.25rem] sm:[--cell:4rem]" role="table" aria-label={t.heatmap.label}>
      <div role="row" className="grid items-end gap-1 pb-2" style={gridStyle}>
        <span role="columnheader" className="text-xs font-semibold text-ink-soft">
          {t.heatmap.student}
        </span>
        {worksheet.questions.map((q) => (
          <span
            role="columnheader"
            key={q.n}
            className={cn(
              "rounded-t-[8px] py-1 text-center font-display text-sm font-semibold",
              q.n === highlightN ? "bg-wrong-soft text-wrong" : "text-ink",
            )}
          >
            {q.n}
          </span>
        ))}
        <span role="columnheader" className="text-right text-xs font-semibold text-ink-soft">
          {t.common.score}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {rows.map((r) => {
          const student = students.find((s) => s.id === r.studentId);
          if (!student) return null;
          return (
            <div role="row" key={r.studentId} className="grid items-center gap-1" style={gridStyle}>
              <Link
                role="rowheader"
                href={`/teacher/student/${student.id}`}
                className="flex min-w-0 items-center gap-1.5 rounded-[8px] py-1 pr-1 text-xs hover:text-accent sm:gap-2 sm:text-sm"
              >
                <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-ink-soft sm:w-5 sm:text-xs">
                  {student.number}
                </span>
                <span className="truncate font-semibold sm:hidden">{shortName(student.name)}</span>
                <span className="hidden truncate font-semibold sm:inline">{student.name}</span>
              </Link>
              {worksheet.questions.map((q) => {
                const a = r.answers.find((x) => x.n === q.n);
                if (!a) return <span key={q.n} className="h-9 rounded-[8px] bg-grid" />;
                const state = cellState(a);
                return (
                  <span
                    role="cell"
                    key={q.n}
                    data-anim="cell"
                    title={`${student.name}, ${t.cls.nthQuestion(q.n)}: ${a.read} (${stateLabel(t, state)})`}
                    aria-label={`${t.cls.nthQuestion(q.n)}: ${a.read}, ${stateLabel(t, state)}`}
                    className={cn(
                      "flex h-9 items-center justify-center overflow-hidden rounded-[8px] px-0.5 text-[10px] font-bold tabular-nums sm:text-xs",
                      CELL_STYLES[state],
                    )}
                  >
                    {a.read}
                  </span>
                );
              })}
              <span role="cell" className="text-right text-sm font-semibold tabular-nums">
                {r.score}/{cols}
              </span>
            </div>
          );
        })}
      </div>

      <div role="row" className="mt-3 grid items-center gap-1 border-t border-grid pt-3" style={gridStyle}>
        <span role="rowheader" className="text-xs font-semibold text-ink-soft">
          {t.heatmap.mistakes}
        </span>
        {questionStats.map((s) => (
          <span
            role="cell"
            key={s.n}
            className={cn(
              "text-center font-display text-sm font-semibold tabular-nums",
              s.n === highlightN ? "text-wrong" : "text-ink",
            )}
          >
            {s.wrong}
          </span>
        ))}
        <span />
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  const t = useT();
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
      {(Object.keys(CELL_STYLES) as CellState[]).map((state) => (
        <li key={state} className="flex items-center gap-2">
          <span className={cn("size-4 rounded-[4px]", CELL_STYLES[state])} aria-hidden />
          {state === "unsure" ? t.heatmap.unsureLegend : t.heatmap[state]}
        </li>
      ))}
    </ul>
  );
}
