import { StudentShell } from "@/components/student/student-shell";

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return <StudentShell>{children}</StudentShell>;
}
