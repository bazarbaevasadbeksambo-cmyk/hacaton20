import type { Metadata } from "next";
import { DEMO_DAY, homework, schedule } from "@/lib/data";
import { HomeworkView } from "./homework-view";

export const metadata: Metadata = { title: "Uy vazifasi · Daftar" };

export default function HomeworkPage() {
  // Homework repeats the topic of today's lesson in the schedule.
  const lessonIndex = schedule.filter((l) => l.day === DEMO_DAY).findIndex((l) => l.subject === homework.subject);
  // Answers stay on the server: only question texts reach the browser.
  const questions = homework.questions.map(({ n, text, textRu, skillId }) => ({ n, text, textRu, skillId }));

  return (
    <HomeworkView
      id={homework.id}
      subject={homework.subject}
      topic={homework.topic}
      lessonNumber={lessonIndex >= 0 ? lessonIndex + 1 : null}
      questions={questions}
    />
  );
}
