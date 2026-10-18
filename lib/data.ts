// Typed access to the static JSON data in /data. Imported at build time,
// so pages stay prerenderable and the demo works fully offline.

import teacherJson from "@/data/teacher.json";
import studentsJson from "@/data/students.json";
import worksheetJson from "@/data/worksheet.json";
import historyJson from "@/data/history.json";
import demoResultsJson from "@/data/demo-results.json";
import gradesJson from "@/data/grades.json";
import scheduleJson from "@/data/schedule.json";
import homeworkJson from "@/data/homework.json";
import readingTextsJson from "@/data/reading-texts.json";
import groupTasksJson from "@/data/group-tasks.json";
import misconceptionsJson from "@/data/misconceptions.json";
import parentTipsJson from "@/data/parent-tips.json";
import helperFallbackJson from "@/data/helper-fallback.json";
import readingQuestionsJson from "@/data/reading-questions.json";
import readingDemoJson from "@/data/reading-demo.json";
import type { GroupTasks } from "./analysis";
import type {
  Grade,
  HistoryCheck,
  Homework,
  Lesson,
  ReadingLang,
  ReadingText,
  SheetResult,
  Student,
  Teacher,
  Weekday,
  Worksheet,
} from "./types";

export const teacher = teacherJson as Teacher;
export const students = studentsJson as Student[];
export const worksheet = worksheetJson as Worksheet;
export const history = historyJson as HistoryCheck[];
export const demoResults = demoResultsJson as { worksheetId: string; date: string; results: SheetResult[] };
export const grades = gradesJson as Grade[];
export const schedule = scheduleJson as Lesson[];
export const homework = homeworkJson as Homework;
export const readingTexts = readingTextsJson as ReadingText[];
type Localized<T> = Record<"uz" | "ru", T>;

/** Fallback mini-tasks per skill (plus "advanced"), by UI language. */
export const groupTasksByLocale = groupTasksJson as Localized<GroupTasks>;
/** Uzbek group tasks: the default for server-side text (AI prompts, Telegram). */
export const groupTasks = groupTasksByLocale.uz;
/** question n -> wrong answer -> what it reveals, by UI language */
export const misconceptions = misconceptionsJson as Localized<Record<string, Record<string, string>>>;
/** skillId -> 10-minute home activity for parents, by language */
export const parentTips = parentTipsJson as Localized<Record<string, string>>;
export const helperFallback = helperFallbackJson as Localized<Record<string, { explain: string; similar: string }>>;
export const readingQuestions = readingQuestionsJson as Record<ReadingLang, { question: string; answer: string }[]>;
/** Prerecorded "recognized" reading per language, for demos without live speech recognition. */
export const readingDemo = readingDemoJson as Record<ReadingLang, string>;

/** The default student shown in the student role. */
export const DEFAULT_STUDENT_ID = students.find((s) => s.name === "Aziz Karimov")!.id;

/** The demo is pinned to the day of today's check, so the schedule and homework always match. */
export const DEMO_DAY: Weekday = "Shanba";

export function getStudent(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function firstName(student: Student): string {
  return student.name.split(" ")[0];
}
