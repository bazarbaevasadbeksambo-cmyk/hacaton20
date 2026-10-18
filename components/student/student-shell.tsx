"use client";

import { BookOpenText, ChartLine, Gamepad2, House, MessageCircleQuestion, NotebookPen } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { useT } from "@/lib/i18n/locale";
import { useCurrentStudent } from "./current-student";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { student } = useCurrentStudent();
  const n = t.nav.student;
  const nav: NavItem[] = [
    { href: "/student", label: n.home[0], short: n.home[1], icon: House },
    { href: "/student/homework", label: n.homework[0], short: n.homework[1], icon: NotebookPen },
    { href: "/student/learn", label: n.learn[0], short: n.learn[1], icon: Gamepad2 },
    { href: "/student/stats", label: n.stats[0], short: n.stats[1], icon: ChartLine },
    { href: "/student/helper", label: n.helper[0], short: n.helper[1], icon: MessageCircleQuestion },
    { href: "/student/reading", label: n.reading[0], short: n.reading[1], icon: BookOpenText },
  ];

  return (
    <AppShell
      nav={nav}
      identity={
        <>
          <p className="text-sm font-semibold text-ink">{student.name}</p>
          <p className="text-xs text-ink-soft">{t.common.className("6-B")}</p>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
