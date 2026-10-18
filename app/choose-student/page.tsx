import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StudentPicker } from "./student-picker";

export default function ChooseStudentPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Orqaga
      </Link>
      <StudentPicker />
    </main>
  );
}
