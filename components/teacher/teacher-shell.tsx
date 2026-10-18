"use client";

import { ClipboardCheck, FileText, House, LayoutGrid, NotebookPen, Upload } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { teacher } from "@/lib/data";
import { tr } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const n = t.nav.teacher;
  const nav: NavItem[] = [
    { href: "/teacher", label: n.home[0], short: n.home[1], icon: House },
    { href: "/teacher/upload", label: n.upload[0], short: n.upload[1], icon: Upload },
    { href: "/teacher/class", label: n.class[0], short: n.class[1], icon: LayoutGrid },
    { href: "/teacher/homework", label: n.homework[0], short: n.homework[1], icon: NotebookPen },
    { href: "/teacher/worksheet", label: n.worksheet[0], short: n.worksheet[1], icon: FileText },
    { href: "/teacher/assessments", label: n.assessments[0], short: n.assessments[1], icon: ClipboardCheck },
  ];

  return (
    <AppShell
      nav={nav}
      identity={
        <>
          <p className="text-sm font-semibold text-ink">{teacher.name}</p>
          <p className="text-xs text-ink-soft">
            {tr(teacher.subject, locale)} · {teacher.className}
          </p>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
