// Generates deterministic demo data into /data. Run: node scripts/gen-data.mts
// Node 24 strips TypeScript types natively, so this runs without a build step.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkAnswer, SKILLS } from "../lib/skills.ts";
import type {
  AnswerResult,
  Assessment,
  HomeworkSubmission,
  Grade,
  HistoryCheck,
  Homework,
  Lesson,
  Question,
  ReadingText,
  SheetResult,
  Student,
  Teacher,
  Weekday,
  Worksheet,
} from "../lib/types.ts";

const OUT = join(import.meta.dirname, "..", "data");
mkdirSync(OUT, { recursive: true });

function save(name: string, value: unknown) {
  writeFileSync(join(OUT, name), JSON.stringify(value, null, 2) + "\n", "utf8");
  console.log("wrote data/" + name);
}

// Deterministic PRNG so regenerating never changes the demo story.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261017);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const round2 = (x: number) => Math.round(x * 100) / 100;

// ---------- Teacher & students ----------

const teacher: Teacher = {
  id: "t-dilnoza",
  name: "Dilnoza Ahmedova",
  subject: "Matematika",
  className: "6-B",
};

const NAMES = [
  "Aziz Karimov", "Madina Yusupova", "Javohir Rahimov", "Dilshod Abdullayev",
  "Sevara Toshmatova", "Bekzod Ergashev", "Nilufar Saidova", "Otabek Nazarov",
  "Malika Xolmatova", "Sardor Qodirov", "Zarina Mirzayeva", "Jasur Islomov",
  "Kamola Ismoilova", "Shoxrux Tursunov", "Gulnoza Raximova", "Doniyor Sobirov",
  "Feruza Jo'rayeva", "Asadbek Umarov", "Mohinur Hasanova", "Ulug'bek Aliyev",
  "Dilfuza Normatova", "Sanjar Yo'ldoshev", "Shahzoda Komilova", "Islom Mahmudov",
  "Rayhona Qosimova", "Abdulloh Fayzullayev", "Laylo Sultonova", "Temur Xudoyberdiyev",
  "Munisa Bakirova", "Behruz Valiyev", "Hulkar Ro'ziyeva", "Akmal Usmonov",
];

const surname = (full: string) => full.split(" ")[1];
const students: Student[] = [...NAMES]
  .sort((a, b) => surname(a).localeCompare(surname(b)))
  .map((name, i) => ({
    id: `s${String(i + 1).padStart(2, "0")}`,
    number: i + 1,
    name,
  }));

const byName = (name: string) => students.find((s) => s.name === name)!;
const AZIZ = byName("Aziz Karimov");
const MADINA = byName("Madina Yusupova");
const JAVOHIR = byName("Javohir Rahimov");

// ---------- Today's worksheet ----------

const [ADD_SAME, ADD_DIFF, REDUCE, COMPARE, MIXED] = SKILLS.map((s) => s.id);

const worksheet: Worksheet = {
  id: "ws-kasrlar-2026-10-17",
  grade: 6,
  className: "6-B",
  topic: "Kasrlar",
  questions: [
    { n: 1, text: "2/7 + 3/7 = ?", answer: "5/7", skillId: ADD_SAME },
    { n: 2, text: "1/3 + 1/4 = ?", answer: "7/12", skillId: ADD_DIFF },
    { n: 3, text: "12/18 kasrni qisqartiring", textRu: "Сократите дробь 12/18", answer: "2/3", skillId: REDUCE },
    { n: 4, text: "3/5 va 4/7 ni taqqoslang (>, < yoki =)", textRu: "Сравните 3/5 и 4/7 (>, < или =)", answer: ">", skillId: COMPARE },
    { n: 5, text: "17/5 ni aralash son ko'rinishida yozing", textRu: "Запишите 17/5 смешанным числом", answer: "3 2/5", skillId: MIXED },
  ],
};

/**
 * Typical wrong answers per skill — mirrors real misconceptions, not random noise.
 * Repeats act as weights: "add tops and bottoms" (2/7) dominates on different denominators.
 */
const WRONG_ANSWERS: Record<string, string[]> = {
  [ADD_SAME]: ["5/14", "5/14", "6/7", "5/49"],
  [ADD_DIFF]: ["2/7", "2/7", "2/7", "2/7", "2/7", "2/7", "2/12", "2/12", "1/7", "7/7"],
  [REDUCE]: ["6/9", "4/6", "3/4"],
  [COMPARE]: ["<", "="],
  [MIXED]: ["3 1/5", "17/5", "2 2/5", "3 5/2"],
};

function makeAnswer(q: Pick<Question, "n" | "skillId" | "answer" | "text">, correct: boolean): AnswerResult {
  const wrongOptions = WRONG_ANSWERS[q.skillId].filter((w) => !checkAnswer(w, q as Question));
  const read = correct ? q.answer : pick(wrongOptions);
  const confidence = round2(rand() < 0.06 ? between(0.52, 0.68) : between(0.86, 0.99));
  return { n: q.n, read, correct: checkAnswer(read, q as Question), confidence };
}

function sheet(worksheetId: string, studentId: string, date: string, answers: AnswerResult[]): SheetResult {
  return { worksheetId, studentId, date, answers, score: answers.filter((a) => a.correct).length };
}

// ---------- Per-student ability model ----------
// Each student has a base ability; certain skills get a personal penalty.
// History spans 4 weekly checks; `trend` shifts ability across them.

type Profile = { base: number; trend: number; weak: Partial<Record<string, number>> };

const profiles = new Map<string, Profile>();
for (const s of students) {
  profiles.set(s.id, {
    base: between(0.55, 0.92),
    trend: between(-0.06, 0.08),
    weak: { [ADD_DIFF]: between(0.15, 0.35), [MIXED]: rand() < 0.35 ? between(0.1, 0.3) : 0 },
  });
}

// ---------- History: 4 past weekly checks ----------

const HISTORY_DATES = ["2026-09-19", "2026-09-26", "2026-10-03", "2026-10-10"];
const historyQuestions: Question[][] = [
  [
    { n: 1, text: "1/5 + 2/5", answer: "3/5", skillId: ADD_SAME },
    { n: 2, text: "8/12 ni qisqartiring", answer: "2/3", skillId: REDUCE },
    { n: 3, text: "2/3 va 3/4 ni taqqoslang", answer: "<", skillId: COMPARE },
    { n: 4, text: "1/2 + 1/3", answer: "5/6", skillId: ADD_DIFF },
    { n: 5, text: "7/3 ni aralash songa aylantiring", answer: "2 1/3", skillId: MIXED },
  ],
  [
    { n: 1, text: "3/8 + 4/8", answer: "7/8", skillId: ADD_SAME },
    { n: 2, text: "1/4 + 1/6", answer: "5/12", skillId: ADD_DIFF },
    { n: 3, text: "15/20 ni qisqartiring", answer: "3/4", skillId: REDUCE },
    { n: 4, text: "5/6 va 4/5 ni taqqoslang", answer: ">", skillId: COMPARE },
    { n: 5, text: "11/4 ni aralash songa aylantiring", answer: "2 3/4", skillId: MIXED },
  ],
  [
    { n: 1, text: "2/9 + 5/9", answer: "7/9", skillId: ADD_SAME },
    { n: 2, text: "2/5 + 1/2", answer: "9/10", skillId: ADD_DIFF },
    { n: 3, text: "9/12 ni qisqartiring", answer: "3/4", skillId: REDUCE },
    { n: 4, text: "3/7 va 2/5 ni taqqoslang", answer: ">", skillId: COMPARE },
    { n: 5, text: "13/6 ni aralash songa aylantiring", answer: "2 1/6", skillId: MIXED },
  ],
  [
    { n: 1, text: "4/11 + 5/11", answer: "9/11", skillId: ADD_SAME },
    { n: 2, text: "1/6 + 3/4", answer: "11/12", skillId: ADD_DIFF },
    { n: 3, text: "14/21 ni qisqartiring", answer: "2/3", skillId: REDUCE },
    { n: 4, text: "5/8 va 3/5 ni taqqoslang", answer: ">", skillId: COMPARE },
    { n: 5, text: "19/4 ni aralash songa aylantiring", answer: "4 3/4", skillId: MIXED },
  ],
];

/** Scripted stories override the model: [check index][question n] -> correct. */
const SCRIPTED: Record<string, (week: number, skillId: string) => boolean> = {
  // Aziz grows: weak start, steady month-long improvement.
  [AZIZ.id]: (week, skill) => {
    const solved: Record<number, string[]> = {
      0: [ADD_SAME],
      1: [ADD_SAME, REDUCE],
      2: [ADD_SAME, REDUCE, COMPARE],
      3: [ADD_SAME, REDUCE, COMPARE, MIXED],
    };
    return solved[week].includes(skill);
  },
  // Madina is strong, but slips specifically on different denominators.
  [MADINA.id]: (week, skill) => (skill === ADD_DIFF ? week < 2 : true),
  // Javohir is consistently strong.
  [JAVOHIR.id]: () => true,
};

const history: HistoryCheck[] = HISTORY_DATES.map((date, week) => {
  const questions = historyQuestions[week];
  const id = `chk-${date}`;
  const results = students.map((s) => {
    const p = profiles.get(s.id)!;
    const answers = questions.map((q) => {
      const scripted = SCRIPTED[s.id];
      const correct = scripted
        ? scripted(week, q.skillId)
        : rand() < Math.min(0.97, p.base + p.trend * (week - 1.5) - (p.weak[q.skillId] ?? 0));
      return makeAnswer(q, correct);
    });
    return sheet(id, s.id, date, answers);
  });
  return { id, date, topic: "Kasrlar", questions: questions.map(({ n, skillId }) => ({ n, skillId })), results };
});

// ---------- Today's results: most of the class fails question 2 ----------
// Groups must be clean for the demo: every student with any mistake
// has missed Q2 (main problem) or Q5 (second problem).

const TODAY = "2026-10-17";
const rest = students.filter((s) => ![AZIZ.id, MADINA.id, JAVOHIR.id].includes(s.id));
const strongestFirst = [...rest].sort((a, b) => profiles.get(b.id)!.base - profiles.get(a.id)!.base);

const allCorrect = new Set(strongestFirst.slice(0, 4).map((s) => s.id)).add(JAVOHIR.id);
const onlyMixedWrong = new Set(strongestFirst.slice(4, 9).map((s) => s.id));
// Everyone else (incl. Aziz, Madina) misses Q2 — 22 of 32 students.

const todayResults: SheetResult[] = students.map((s) => {
  const p = profiles.get(s.id)!;
  const answers = worksheet.questions.map((q) => {
    let correct: boolean;
    if (allCorrect.has(s.id)) correct = true;
    else if (onlyMixedWrong.has(s.id)) correct = q.skillId !== MIXED;
    else if (q.skillId === ADD_DIFF) correct = false;
    else if (s.id === AZIZ.id || s.id === MADINA.id) correct = true;
    else if (q.skillId === MIXED) correct = rand() > 0.3;
    else correct = rand() < Math.max(0.7, p.base);
    return makeAnswer(q, correct);
  });
  return sheet(worksheet.id, s.id, TODAY, answers);
});

// A couple of guaranteed low-confidence reads so "Tekshiring" is visible in the demo.
for (const [studentIdx, qIdx] of [[3, 2], [11, 0], [20, 3]] as const) {
  todayResults[studentIdx].answers[qIdx].confidence = round2(between(0.55, 0.66));
}

// ---------- Grades ----------

const scoreToGrade = (score: number) => (score >= 5 ? 5 : score === 4 ? 4 : score === 3 ? 3 : 2);
const OTHER_SUBJECTS: [string, string][] = [
  ["Ona tili", "Fe'l zamonlari"],
  ["Ingliz tili", "Present Simple"],
  ["Tarix", "Amir Temur davlati"],
  ["Biologiya", "O'simlik hujayrasi"],
  ["Rus tili", "Имя существительное"],
];

const grades: Grade[] = students.flatMap((s) => {
  const p = profiles.get(s.id)!;
  const today = todayResults.find((r) => r.studentId === s.id)!;
  const math: Grade = { studentId: s.id, subject: "Matematika", value: scoreToGrade(today.score), topic: "Kasrlar", date: TODAY };
  const others = OTHER_SUBJECTS.map(([subject, topic], i): Grade => ({
    studentId: s.id,
    subject,
    value: Math.max(3, Math.min(5, Math.round(p.base * 5 + between(-0.6, 0.8)))),
    topic,
    date: `2026-10-${String(12 + i).padStart(2, "0")}`,
  }));
  return [math, ...others];
});

// ---------- Weekly schedule for 6-B ----------

const TIMES = ["08:00", "08:55", "09:50", "10:55", "11:50", "12:45"];
const WEEK: Record<Weekday, [string, string][]> = {
  Dushanba: [["Matematika", "21"], ["Ona tili", "14"], ["Ingliz tili", "32"], ["Tarix", "18"], ["Jismoniy tarbiya", "Sport zal"], ["Biologiya", "25"]],
  Seshanba: [["Rus tili", "16"], ["Matematika", "21"], ["Adabiyot", "14"], ["Geografiya", "19"], ["Informatika", "40"], ["Musiqa", "11"]],
  Chorshanba: [["Matematika", "21"], ["Ingliz tili", "32"], ["Ona tili", "14"], ["Biologiya", "25"], ["Tasviriy san'at", "12"], ["Tarbiya", "18"]],
  Payshanba: [["Ona tili", "14"], ["Matematika", "21"], ["Tarix", "18"], ["Rus tili", "16"], ["Jismoniy tarbiya", "Sport zal"], ["Texnologiya", "07"]],
  Juma: [["Matematika", "21"], ["Adabiyot", "14"], ["Ingliz tili", "32"], ["Geografiya", "19"], ["Informatika", "40"], ["Rus tili", "16"]],
  Shanba: [["Matematika", "21"], ["Ona tili", "14"], ["Tarix", "18"], ["Ingliz tili", "32"], ["Biologiya", "25"], ["Jismoniy tarbiya", "Sport zal"]],
};
const schedule: Lesson[] = Object.entries(WEEK).flatMap(([day, lessons]) =>
  lessons.map(([subject, room], i) => ({ day: day as Weekday, time: TIMES[i], subject, room })),
);

// ---------- Homework for today ----------

const homework: Homework = {
  id: "hw-kasrlar-2026-10-17",
  date: TODAY,
  subject: "Matematika",
  topic: "Kasrlar: takrorlash",
  questions: [
    { n: 1, text: "3/10 + 4/10 = ?", answer: "7/10", skillId: ADD_SAME },
    { n: 2, text: "1/2 + 1/5 = ?", answer: "7/10", skillId: ADD_DIFF },
    { n: 3, text: "2/3 + 1/6 = ?", answer: "5/6", skillId: ADD_DIFF },
    { n: 4, text: "16/24 kasrni qisqartiring", textRu: "Сократите дробь 16/24", answer: "2/3", skillId: REDUCE },
    { n: 5, text: "23/7 ni aralash son ko'rinishida yozing", textRu: "Запишите 23/7 смешанным числом", answer: "3 2/7", skillId: MIXED },
  ],
};

// ---------- Reading texts (original, written for this project) ----------

const readingTexts: ReadingText[] = [
  {
    lang: "uz",
    title: "Kichik bog'",
    text: "Maktabimiz hovlisida kichik bog' bor. Bahorda o'quvchilar u yerga gul va daraxt ekishadi. Har kuni navbatchilar ularni sug'oradi. Yozda bog'da soya ko'payadi va bolalar tanaffusda shu yerda dam olishadi.",
  },
  {
    lang: "ru",
    title: "Утро в школе",
    text: "Утром в школьном дворе тихо. Первым приходит сторож и открывает ворота. Потом появляются учителя, а за ними ученики с рюкзаками. Через несколько минут звенит звонок, и начинается новый день.",
  },
  {
    lang: "en",
    title: "The Old Bridge",
    text: "There is an old stone bridge near our village. Every morning children cross it on the way to school. In spring the river under the bridge is fast and loud. In summer it becomes slow, and we can see small fish in the water.",
  },
];

// ---------- Fallback texts for groups (used when AI is off or fails) ----------

const groupTasks: Record<string, string> = {
  [ADD_SAME]: "1) 3/9 + 4/9 = ?\n2) 5/12 + 6/12 = ?\n3) 2/15 + 7/15 + 4/15 = ?",
  [ADD_DIFF]:
    "Avval umumiy maxrajni toping, keyin qo'shing.\n1) 1/2 + 1/3 = ?\n2) 2/5 + 1/4 = ?\n3) 3/4 + 1/6 = ?",
  [REDUCE]: "Kasrni oxirigacha qisqartiring.\n1) 6/8\n2) 15/25\n3) 24/36",
  [COMPARE]: "Belgini qo'ying: >, < yoki =\n1) 2/3 va 3/5\n2) 4/9 va 1/2\n3) 5/10 va 3/6",
  [MIXED]: "Aralash son ko'rinishida yozing.\n1) 9/4\n2) 14/3\n3) 27/5",
  advanced: "1) 2 1/3 + 1 3/4 = ?\n2) Kasrlarni o'sish tartibida yozing: 5/6, 3/4, 7/9\n3) Idishning 2/5 qismi suv bilan to'la. Yana 1/3 qismi quyildi. Idishning qancha qismi bo'sh qoldi?",
};

/** 10-minute home activity per skill for the fallback parent message. Plain, kind Uzbek. */
const parentTips: Record<string, string> = {
  [ADD_SAME]: "Uyda pitsa yoki nonni teng bo'laklarga bo'lib, «3 bo'lak + 2 bo'lak nechta bo'ladi?» deb so'rang. Maxraj o'zgarmasligini birga ko'ring.",
  [ADD_DIFF]: "Bitta olmani 2 ga, boshqasini 3 ga bo'ling va bo'laklarni teng qilish uchun ikkalasini 6 bo'lakka bo'lib ko'ring. Shunday 2–3 ta misolni birga yeching: avval umumiy maxraj, keyin qo'shish.",
  [REDUCE]: "Har kuni 3 ta kasrni birga qisqartiring (masalan, 6/8, 10/15). «Surat va maxrajni qaysi songa bo'lsa bo'ladi?» deb so'rang.",
  [COMPARE]: "Ikki kasrni rasmda chizib solishtiring: qaysi bo'lak kattaroq? Keyin umumiy maxrajga keltirib tekshiring.",
  [MIXED]: "17 ta konfetni 5 tadan qilib bo'ling: nechta to'liq guruh va nechta ortib qoldi? Shu 3 2/5 degani ekanini birga ko'ring.",
};

const groupTasksRu: Record<string, string> = {
  [ADD_SAME]: "1) 3/9 + 4/9 = ?\n2) 5/12 + 6/12 = ?\n3) 2/15 + 7/15 + 4/15 = ?",
  [ADD_DIFF]: "Сначала найдите общий знаменатель, потом складывайте.\n1) 1/2 + 1/3 = ?\n2) 2/5 + 1/4 = ?\n3) 3/4 + 1/6 = ?",
  [REDUCE]: "Сократите дробь до конца.\n1) 6/8\n2) 15/25\n3) 24/36",
  [COMPARE]: "Поставьте знак: >, < или =\n1) 2/3 и 3/5\n2) 4/9 и 1/2\n3) 5/10 и 3/6",
  [MIXED]: "Запишите смешанным числом.\n1) 9/4\n2) 14/3\n3) 27/5",
  advanced: "1) 2 1/3 + 1 3/4 = ?\n2) Запишите дроби по возрастанию: 5/6, 3/4, 7/9\n3) Сосуд заполнен водой на 2/5. Долили ещё 1/3. Какая часть сосуда осталась пустой?",
};

const parentTipsRu: Record<string, string> = {
  [ADD_SAME]: "Разрежьте пиццу или лепёшку на равные части и спросите: «3 куска + 2 куска — сколько?» Покажите, что знаменатель не меняется.",
  [ADD_DIFF]: "Разрежьте одно яблоко на 2 части, другое на 3, а потом оба — на 6 равных частей. Решите вместе 2–3 примера: сначала общий знаменатель, потом сложение.",
  [REDUCE]: "Каждый день сокращайте вместе 3 дроби (например, 6/8, 10/15). Спрашивайте: «На какое число делятся и числитель, и знаменатель?»",
  [COMPARE]: "Нарисуйте две дроби и сравните: какая часть больше? Потом проверьте через общий знаменатель.",
  [MIXED]: "Разложите 17 конфет по 5: сколько полных групп и сколько осталось? Покажите, что это и есть 3 2/5.",
};

/** Teacher-facing explanation of what a typical wrong answer reveals. Keyed by question n of today's sheet. */
const misconceptions: Record<string, Record<string, string>> = {
  "1": { "5/14": "Maxrajlarni ham qo'shib yuborishgan" },
  "2": {
    "2/7": "Suratlarni va maxrajlarni alohida qo'shishgan",
    "2/12": "Umumiy maxrajni topib, suratlarni o'zgartirmagan",
    "1/7": "Maxrajlarni qo'shib, suratni o'zgartirmagan",
  },
  "3": { "6/9": "Kasrni oxirigacha qisqartirmagan", "4/6": "Kasrni oxirigacha qisqartirmagan" },
  "4": { "<": "Faqat maxrajlarga qarab taqqoslagan" },
  "5": { "3 1/5": "Qoldiqni noto'g'ri hisoblagan", "17/5": "Butun qismini ajratmagan" },
};

const misconceptionsRu: Record<string, Record<string, string>> = {
  "1": { "5/14": "Сложили и знаменатели тоже" },
  "2": {
    "2/7": "Сложили отдельно числители и знаменатели",
    "2/12": "Нашли общий знаменатель, но не изменили числители",
    "1/7": "Сложили знаменатели, а числитель не изменили",
  },
  "3": { "6/9": "Сократили дробь не до конца", "4/6": "Сократили дробь не до конца" },
  "4": { "<": "Сравнивали только по знаменателям" },
  "5": { "3 1/5": "Неверно посчитали остаток", "17/5": "Не выделили целую часть" },
};

// ---------- Seed: one assessment and already-submitted work ----------
// The teacher's homework page must not be empty on stage, so most of the class has handed in.

const assessment: Assessment = {
  id: "as-bsb-har-xil",
  kind: "BSB",
  title: "BSB: Har xil maxrajli kasrlarni qo'shish",
  skillId: ADD_DIFF,
  createdAt: "2026-10-16T09:00:00.000Z",
  examMode: true,
  questions: [
    { n: 1, text: "1/2 + 1/4 = ?", answer: "3/4", skillId: ADD_DIFF },
    { n: 2, text: "2/3 + 1/5 = ?", answer: "13/15", skillId: ADD_DIFF },
    { n: 3, text: "3/4 + 1/6 = ?", answer: "11/12", skillId: ADD_DIFF },
    { n: 4, text: "1/3 + 3/8 = ?", answer: "17/24", skillId: ADD_DIFF },
    { n: 5, text: "5/6 + 1/9 = ?", answer: "17/18", skillId: ADD_DIFF },
  ],
};

function submit(
  student: Student,
  workId: string,
  questions: Question[],
  submittedAt: string,
  extra: Partial<HomeworkSubmission> = {},
): HomeworkSubmission {
  const p = profiles.get(student.id)!;
  const answers = questions.map((q) => {
    const correct = rand() < Math.min(0.95, p.base + 0.05 - (p.weak[q.skillId] ?? 0) * 0.6);
    // Typed answers have no reading uncertainty.
    return { ...makeAnswer(q, correct), confidence: 1 };
  });
  return {
    studentId: student.id,
    homeworkId: workId,
    answers,
    score: answers.filter((a) => a.correct).length,
    leftPageCount: rand() < 0.75 ? 0 : Math.ceil(rand() * 4),
    submittedAt,
    examMode: false,
    ...extra,
  };
}

const homeworkSubmissions: HomeworkSubmission[] = [
  // Aziz is left out on purpose: he does today's homework live in the demo.
  ...students
    .filter((s) => s.id !== AZIZ.id && rand() < 0.8)
    .map((s, i) => submit(s, homework.id, homework.questions, `2026-10-17T${String(15 + (i % 5)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00.000Z`)),
  ...students
    .filter((s) => s.id !== AZIZ.id)
    .map((s, i) => {
      const episodes = rand() < 0.7 ? 0 : Math.ceil(rand() * 3);
      return submit(s, assessment.id, assessment.questions, `2026-10-16T09:${String(20 + (i % 25)).padStart(2, "0")}:00.000Z`, {
        examMode: true,
        focusSummary: { episodes, totalSeconds: episodes ? Math.round(episodes * between(6, 14)) : 0 },
      });
    }),
];

// ---------- Offline fallbacks for the P3 helpers ----------

/** Maslahatchi: a kind explanation of each skill and a similar task (no ready answer). */
const helperFallbackRu: Record<string, { explain: string; similar: string }> = {
  [ADD_SAME]: {
    explain: "Если знаменатели одинаковые, складываем только числители, знаменатель не меняется. Например, 2/7 + 3/7: числители 2 + 3 = 5, знаменатель остаётся 7.",
    similar: "Попробуй сам: 4/9 + 3/9 = ?",
  },
  [ADD_DIFF]: {
    explain: "Если знаменатели разные, сразу складывать нельзя. Сначала находим общий знаменатель: для 1/3 и 1/4 это 12. Тогда 1/3 = 4/12, 1/4 = 3/12. Теперь складываем числители, знаменатель остаётся 12. Складывать числитель с числителем, а знаменатель со знаменателем — ошибка.",
    similar: "Попробуй сам: 1/2 + 1/5 = ? Сначала найди общий знаменатель.",
  },
  [REDUCE]: {
    explain: "Чтобы сократить дробь, делим числитель и знаменатель на одно и то же число. Если найти наибольший общий делитель, дробь сократится до конца за один шаг. Для 12/18 это 6.",
    similar: "Попробуй сам: сократи 20/30 до конца.",
  },
  [COMPARE]: {
    explain: "Чтобы сравнить дроби, приводим их к общему знаменателю или переводим в десятичные. Смотреть только на знаменатель недостаточно: чем больше знаменатель, тем меньше доля.",
    similar: "Попробуй сам: сравни 2/3 и 5/8.",
  },
  [MIXED]: {
    explain: "Делим числитель на знаменатель: целая часть — частное, новый числитель — остаток, знаменатель не меняется. В 17/5: 17 : 5 = 3 и 2 в остатке.",
    similar: "Попробуй сам: запиши 22/7 смешанным числом.",
  },
};

const helperFallback: Record<string, { explain: string; similar: string }> = {
  [ADD_SAME]: {
    explain: "Maxrajlar bir xil bo'lsa, faqat suratlarni qo'shamiz, maxraj o'zgarmaydi. Masalan, 2/7 + 3/7: suratlar 2 + 3 = 5, maxraj 7 qoladi.",
    similar: "O'zing sinab ko'r: 4/9 + 3/9 = ?",
  },
  [ADD_DIFF]: {
    explain: "Maxrajlar har xil bo'lsa, ularni darhol qo'shib bo'lmaydi. Avval umumiy maxrajni topamiz: 1/3 va 1/4 uchun bu 12. Keyin 1/3 = 4/12, 1/4 = 3/12 bo'ladi. Endi suratlarni qo'shamiz, maxraj 12 qoladi. Surat bilan suratni, maxraj bilan maxrajni qo'shish — xato yo'l.",
    similar: "O'zing sinab ko'r: 1/2 + 1/5 = ? Avval umumiy maxrajni top.",
  },
  [REDUCE]: {
    explain: "Kasrni qisqartirish uchun surat va maxrajni bir xil songa bo'lamiz. Eng katta umumiy bo'luvchini topsang, bir qadamda oxirigacha qisqaradi. 12/18 uchun bu 6.",
    similar: "O'zing sinab ko'r: 20/30 kasrni oxirigacha qisqartir.",
  },
  [COMPARE]: {
    explain: "Kasrlarni taqqoslash uchun ularni umumiy maxrajga keltiramiz yoki o'nli kasrga aylantiramiz. Faqat maxrajga qarash yetmaydi: maxraj katta bo'lsa, bo'lak kichik bo'ladi.",
    similar: "O'zing sinab ko'r: 2/3 va 5/8 ni taqqosla.",
  },
  [MIXED]: {
    explain: "Suratni maxrajga bo'lamiz: butun qism — bo'linma, yangi surat — qoldiq, maxraj o'zgarmaydi. 17/5 da 17 : 5 = 3 va 2 qoldiq.",
    similar: "O'zing sinab ko'r: 22/7 ni aralash son ko'rinishida yoz.",
  },
};

/** Reading coach: two comprehension questions per text with a short model answer. */
const readingQuestions: Record<string, { question: string; answer: string }[]> = {
  uz: [
    { question: "Bog' qayerda joylashgan?", answer: "Maktab hovlisida." },
    { question: "Yozda bolalar bog'da nima qilishadi?", answer: "Tanaffusda soyada dam olishadi." },
  ],
  ru: [
    { question: "Кто приходит в школу первым?", answer: "Сторож." },
    { question: "Что происходит, когда звенит звонок?", answer: "Начинается новый день (уроки)." },
  ],
  en: [
    { question: "What do children cross every morning?", answer: "The old stone bridge." },
    { question: "How is the river different in summer?", answer: "It becomes slow and you can see small fish." },
  ],
};

/** Prerecorded "recognized" reading for the demo when live recognition is unavailable. */
const readingDemoTranscripts: Record<string, string> = {
  uz: "Maktabimiz hovlisida kichik bog' bor. Bahorda o'quvchilar u yerga gul va daraxt ekadi. Har kuni navbatchilar ularni sug'oradi. Yozda bog'da soya ko'payadi va bolalar shu yerda dam olishadi.",
  ru: "Утром в школьном дворе тихо. Первым приходит сторож и открывает ворота. Потом появляются учителя а за ними ученики. Через несколько минут звенит звонок и начинается новый день.",
  en: "There is an old stone bridge near our village. Every morning children cross it on the way to school. In spring the river under the bridge is fast. In summer it becomes slow and we can see fish in the water.",
};

// ---------- Write ----------

save("teacher.json", teacher);
save("students.json", students);
save("worksheet.json", worksheet);
save("history.json", history);
save("demo-results.json", { worksheetId: worksheet.id, date: TODAY, results: todayResults });
save("grades.json", grades);
save("schedule.json", schedule);
save("homework.json", homework);
save("reading-texts.json", readingTexts);
// Localized content is stored as { uz, ru }.
save("group-tasks.json", { uz: groupTasks, ru: groupTasksRu });
save("misconceptions.json", { uz: misconceptions, ru: misconceptionsRu });
save("parent-tips.json", { uz: parentTips, ru: parentTipsRu });
save("assessments.json", [assessment]);
save("homework-submissions.json", homeworkSubmissions);
save("helper-fallback.json", { uz: helperFallback, ru: helperFallbackRu });
save("reading-questions.json", readingQuestions);
save("reading-demo.json", readingDemoTranscripts);

const q2Wrong = todayResults.filter((r) => !r.answers[1].correct).length;
console.log(`today: ${q2Wrong}/${students.length} missed Q2`);
