"use client";

import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, NotebookPen } from "lucide-react";
import { SettingsControls } from "@/components/settings-controls";
import { teacher } from "@/lib/data";
import { tr } from "@/lib/i18n/content";
import { useLocale, useT } from "@/lib/i18n/locale";

export function Landing() {
  const t = useT();
  const locale = useLocale();
  const l = t.landing;

  const roles = [
    {
      href: "/teacher",
      title: l.teacher,
      hint: `${teacher.name} · ${tr(teacher.subject, locale)}, ${teacher.className}`,
      icon: NotebookPen,
      tone: "bg-ink text-on-ink hover:bg-ink/90",
      hintTone: "text-on-ink/70",
    },
    {
      href: "/choose-student",
      title: l.student,
      hint: l.studentHint,
      icon: GraduationCap,
      tone: "border border-grid bg-surface text-ink hover:border-ink-soft",
      hintTone: "text-ink-soft",
    },
    {
      href: "/insights",
      title: l.system,
      hint: l.systemHint,
      icon: Building2,
      tone: "border border-grid bg-surface text-ink hover:border-ink-soft",
      hintTone: "text-ink-soft",
    },
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-6 sm:px-6">
      <div className="flex justify-end">
        <SettingsControls />
      </div>

      <section className="flex flex-1 flex-col justify-center py-10">
        <p className="mb-3 text-sm font-semibold text-wrong">{l.kicker}</p>
        <h1 className="mb-4 text-[26px] font-semibold leading-tight text-balance break-words text-ink sm:text-5xl">
          {l.title}
        </h1>
        <p className="mb-10 max-w-xl text-base text-ink-soft sm:text-lg">{l.lead}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map(({ href, title, hint, icon: Icon, tone, hintTone }) => (
            <Link
              key={href}
              href={href}
              className={`group flex min-h-40 flex-col justify-between rounded-[12px] p-6 transition-colors ${tone}`}
            >
              <Icon className="size-7" aria-hidden />
              <div>
                <span className="flex items-center gap-2 font-display text-xl font-semibold">
                  {title}
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
                <span className={`mt-1 block text-sm ${hintTone}`}>{hint}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="pillars" className="pb-8">
        <h2 id="pillars" className="mb-4 text-lg font-semibold">
          {l.pillarsTitle}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {l.pillars.map(([title, text], i) => (
            <li key={title} className="flex gap-3 rounded-[12px] border border-grid bg-surface p-4">
              <span className="font-display text-sm font-semibold text-wrong">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-sm text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
