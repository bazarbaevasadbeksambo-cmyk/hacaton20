// Localized names for data that is stored in Uzbek (subjects, topics, weekdays, questions).
// Unknown values fall back to the original Uzbek text.

import type { Locale } from "./dict";
import type { Question, PublicQuestion, Weekday } from "../types";

const RU: Record<string, string> = {
  // Subjects
  Matematika: "Математика",
  "Ona tili": "Родной язык",
  "Ingliz tili": "Английский язык",
  Tarix: "История",
  Biologiya: "Биология",
  "Rus tili": "Русский язык",
  "Jismoniy tarbiya": "Физкультура",
  Adabiyot: "Литература",
  Geografiya: "География",
  Informatika: "Информатика",
  Musiqa: "Музыка",
  "Tasviriy san'at": "ИЗО",
  Tarbiya: "Воспитание",
  Texnologiya: "Технология",
  Algebra: "Алгебра",
  Fizika: "Физика",
  // Topics
  Kasrlar: "Дроби",
  "Kasrlar: takrorlash": "Дроби: повторение",
  "Fe'l zamonlari": "Времена глагола",
  "Present Simple": "Present Simple",
  "Amir Temur davlati": "Государство Амира Темура",
  "O'simlik hujayrasi": "Клетка растения",
  "Имя существительное": "Имя существительное",
  // Weekdays
  Dushanba: "Понедельник",
  Seshanba: "Вторник",
  Chorshanba: "Среда",
  Payshanba: "Четверг",
  Juma: "Пятница",
  Shanba: "Суббота",
};

/** Subject, topic or weekday name in the UI language. */
export function tr(value: string, locale: Locale): string {
  return locale === "ru" ? (RU[value] ?? value) : value;
}

export function weekday(day: Weekday, locale: Locale) {
  return tr(day, locale);
}

/** Question text in the UI language (questions carry an optional Russian text). */
export function questionText(q: Pick<Question, "text"> & { textRu?: string } | PublicQuestion, locale: Locale) {
  return locale === "ru" && q.textRu ? q.textRu : q.text;
}

/** "BSB: Har xil ..." -> localized kind prefix stripped; titles are rebuilt from skill names in the UI. */
export function assessmentKind(kind: "BSB" | "ChSB", locale: Locale) {
  return locale === "ru" ? (kind === "BSB" ? "БСБ" : "ЧСБ") : kind;
}
