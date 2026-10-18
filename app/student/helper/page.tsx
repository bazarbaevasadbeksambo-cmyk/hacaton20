import type { Metadata } from "next";
import { HelperChat } from "./helper-chat";

export const metadata: Metadata = { title: "Maslahatchi · Daftar" };

export default function HelperPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm text-ink-soft">Xatoni tushunish uchun yordamchi</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Maslahatchi</h1>
      </header>
      <HelperChat />
    </div>
  );
}
