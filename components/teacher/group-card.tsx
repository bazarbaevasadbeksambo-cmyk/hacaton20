"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardLabel } from "@/components/ui/card";
import { shortName } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n/locale";
import { skillName } from "@/lib/skills";
import type { Group, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

type GroupCardProps = { group: Group; index: number; students: Student[] };

const ACCENTS = ["text-wrong", "text-unsure-ink", "text-correct"] as const;

export function GroupCard({ group, index, students }: GroupCardProps) {
  const t = useT();
  const locale = useLocale();
  const members = group.studentIds
    .map((id) => students.find((s) => s.id === id))
    .filter((s) => s !== undefined);

  return (
    <Card data-anim="group" className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardLabel className={cn(ACCENTS[index] ?? "text-ink-soft")}>{t.cls.group(index + 1)}</CardLabel>
        <Badge>{t.cls.studentsCount(members.length)}</Badge>
      </div>
      <h3 className="mb-3 text-base font-semibold leading-snug">
        {group.skillId ? skillName(group.skillId, locale) : t.cls.advancedGroup}
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-ink-soft">{members.map((s) => shortName(s.name)).join(", ")}</p>

      <div className="mt-auto rounded-[8px] border border-dashed border-grid bg-paper p-3">
        <p className="mb-2 text-xs font-semibold text-ink-soft">{t.cls.tomorrowTask}</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{group.task}</p>
      </div>
    </Card>
  );
}
