import type { Metadata } from "next";
import { StudentHome } from "./student-home";

export const metadata: Metadata = { title: "O'quvchi · Daftar" };

export default function StudentHomePage() {
  return <StudentHome />;
}
