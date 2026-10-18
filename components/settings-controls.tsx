"use client";

import { Moon, Sun } from "lucide-react";
import { setLocale, useLocale, useT } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/dict";
import { setTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LOCALES: { id: Locale; label: string }[] = [
  { id: "uz", label: "UZ" },
  { id: "ru", label: "RU" },
];

/** Language switch (UZ / RU) and light/dark toggle — shown on every screen. */
export function SettingsControls({ className }: { className?: string }) {
  const t = useT();
  const locale = useLocale();
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div role="radiogroup" aria-label={t.common.language} className="flex rounded-[10px] border border-grid bg-surface p-0.5">
        {LOCALES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={locale === l.id}
            onClick={() => setLocale(l.id)}
            className={cn(
              "h-7 rounded-[8px] px-2.5 text-xs font-bold transition-colors",
              locale === l.id ? "bg-ink text-on-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={t.common.theme[next]}
        title={t.common.theme[next]}
        className="flex size-8 items-center justify-center rounded-[10px] border border-grid bg-surface text-ink-soft transition-colors hover:text-ink"
      >
        {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
