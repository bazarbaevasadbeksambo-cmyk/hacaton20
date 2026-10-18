"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n/locale";
import type { Student } from "@/lib/types";

export function BackToClass() {
  const t = useT();
  return (
    <Link
      href="/teacher/class"
      className="inline-flex items-center gap-2 self-start text-sm font-semibold text-ink-soft hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t.report.backToClass}
    </Link>
  );
}

export function StudentHeader({ student, className }: { student: Student; className: string }) {
  const t = useT();
  return (
    <header>
      <p className="mb-1 text-sm text-ink-soft">
        {className} · {t.report.nth(student.number)}
      </p>
      <h1 className="text-2xl font-semibold sm:text-3xl">{student.name}</h1>
    </header>
  );
}
