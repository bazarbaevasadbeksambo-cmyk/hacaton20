"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDay, formatScore } from "@/lib/format";
import type { CheckPoint } from "@/lib/stats";
import { useLocale, useT } from "@/lib/i18n/locale";

type ScoreChartProps = { points: CheckPoint[]; maxScore: number; studentLabel: string };

// Theme tokens: SVG presentation attributes resolve CSS variables, so the chart follows dark mode.
const INK_SOFT = "var(--ink-soft)";
const GRID = "var(--grid)";
const ACCENT = "var(--accent)";

export function ScoreChart({ points, maxScore, studentLabel }: ScoreChartProps) {
  const t = useT();
  const locale = useLocale();
  const data = points.map((p) => ({ ...p, label: formatDay(p.date, locale) }));

  return (
    <div className="h-56 w-full sm:h-64" role="img" aria-label={t.report.chartLabel(studentLabel)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: INK_SOFT, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis
            domain={[0, maxScore]}
            ticks={Array.from({ length: maxScore + 1 }, (_, i) => i)}
            tick={{ fill: INK_SOFT, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [formatScore(Number(value)), name === "score" ? studentLabel : t.report.classAvg]}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            itemStyle={{ color: "var(--ink)" }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${GRID}`,
              boxShadow: "none",
              fontSize: 12,
              background: "var(--surface)",
            }}
          />
          <Line
            type="monotone"
            dataKey="classAverage"
            stroke={INK_SOFT}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={ACCENT}
            strokeWidth={3}
            dot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
