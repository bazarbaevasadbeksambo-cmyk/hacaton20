import type { Locale } from "./i18n/dict";

const MONTHS: Record<Locale, string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

/** "2026-10-17" -> "17-oktabr" / "17 октября" */
export function formatDay(iso: string, locale: Locale = "uz"): string {
  const [, m, d] = iso.split("-").map(Number);
  return locale === "ru" ? `${d} ${MONTHS.ru[m - 1]}` : `${d}-${MONTHS.uz[m - 1]}`;
}

/** 3.4375 -> "3,4" (decimal comma in both languages) */
export function formatScore(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** "Aziz Karimov" -> "Aziz K." */
export function shortName(full: string): string {
  const [first, last] = full.split(" ");
  return last ? `${first} ${last[0]}.` : first;
}
