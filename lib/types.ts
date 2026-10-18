// Single source of truth for domain types. Shared by UI, API routes and data scripts.

export type Skill = { id: string; name: string };

/** `text` is Uzbek; `textRu` is the optional Russian version for the UI. */
export type Question = { n: number; text: string; textRu?: string; answer: string; skillId: string };

export type Worksheet = {
  id: string;
  grade: number;
  className: string;
  topic: string;
  questions: Question[];
};

export type Student = { id: string; number: number; name: string };

export type Teacher = { id: string; name: string; subject: string; className: string };

export type AnswerResult = { n: number; read: string; correct: boolean; confidence: number };

export type SheetResult = {
  worksheetId: string;
  studentId: string;
  date: string; // ISO date, YYYY-MM-DD
  answers: AnswerResult[];
  score: number; // number of correct answers
};

/** One past check of the whole class: which skill each question tested on that day. */
export type HistoryCheck = {
  id: string;
  date: string;
  topic: string;
  questions: Pick<Question, "n" | "skillId">[];
  results: SheetResult[];
};

export type Group = {
  id: string;
  title: string;
  skillId: string | null; // null = "everything correct" group
  studentIds: string[];
  task: string;
};

export type Weekday = "Dushanba" | "Seshanba" | "Chorshanba" | "Payshanba" | "Juma" | "Shanba";

export type Lesson = { day: Weekday; time: string; subject: string; room: string };

export type Grade = { studentId: string; subject: string; value: number; topic: string; date: string };

export type FocusSummary = { episodes: number; totalSeconds: number };

export type Homework = {
  id: string;
  date: string;
  subject: string;
  topic: string;
  questions: Question[];
};

export type HomeworkSubmission = {
  studentId: string;
  homeworkId: string;
  answers: AnswerResult[];
  score: number;
  leftPageCount: number;
  submittedAt: string;
  teacherGrade?: number;
  examMode: boolean;
  focusSummary?: FocusSummary;
};

export type ReadingLang = "uz" | "ru" | "en";

export type ReadingText = { lang: ReadingLang; title: string; text: string };

/** Parent message produced for a single student after a check. */
export type ParentMessage = { studentId: string; text: string };

/** BSB — summative assessment for a section (one topic); ChSB — for the quarter (all topics). */
export type AssessmentKind = "BSB" | "ChSB";

export type Assessment = {
  id: string;
  kind: AssessmentKind;
  title: string;
  skillId: string | null; // null for ChSB (mixed topics)
  createdAt: string;
  questions: Question[]; // answers never leave the server for students
  examMode: boolean;
};

/** What a student is allowed to see of a question. */
export type PublicQuestion = Pick<Question, "n" | "text" | "textRu" | "skillId">;
