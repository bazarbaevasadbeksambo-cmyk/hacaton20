"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { DEFAULT_STUDENT_ID, getStudent, students } from "@/lib/data";
import { setCurrentStudentId } from "@/components/student/current-student";

export function StudentPicker() {
  const router = useRouter();
  const defaultStudent = getStudent(DEFAULT_STUDENT_ID)!;

  function enterAs(id: string) {
    setCurrentStudentId(id);
    router.push("/student");
  }

  return (
    <>
      <Card className="mb-10">
        <CardLabel className="mb-2">6-B sinf</CardLabel>
        <h1 className="mb-6 text-2xl font-semibold sm:text-3xl">{defaultStudent.name}</h1>
        <Button size="lg" className="w-full sm:w-auto" onClick={() => enterAs(defaultStudent.id)}>
          Kirish
          <ArrowRight aria-hidden />
        </Button>
      </Card>

      <h2 className="mb-4 text-base font-semibold">Boshqa o'quvchi sifatida kirish</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {students.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => enterAs(s.id)}
              className="flex w-full items-center gap-3 rounded-[12px] border border-grid bg-surface px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-ink-soft"
            >
              <span className="w-6 text-right tabular-nums text-ink-soft">{s.number}</span>
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
