import type { Metadata } from "next";
import { ReadingCoach } from "./reading-coach";

export const metadata: Metadata = { title: "O'qish murabbiyi · Daftar" };

export default function ReadingPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm text-ink-soft">Matnni ovoz chiqarib o'qing</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">O'qish murabbiyi</h1>
      </header>
      <ReadingCoach />
    </div>
  );
}
