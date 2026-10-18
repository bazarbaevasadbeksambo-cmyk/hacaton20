"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { useCurrentStudent } from "@/components/student/current-student";
import { worksheet } from "@/lib/data";
import { useLatestCheck } from "@/lib/results-store";
import { skillName } from "@/lib/skills";
import type { HelperResponse } from "@/app/api/helper/route";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function HelperChat() {
  const { student } = useCurrentStudent();
  const latest = useLatestCheck();
  const result = latest.results.find((r) => r.studentId === student.id);
  const mistakes = (result?.answers ?? []).filter((a) => !a.correct);

  const [selectedN, setSelectedN] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const selected = mistakes.find((m) => m.n === selectedN);

  async function ask(n: number, history: Message[]) {
    const read = mistakes.find((m) => m.n === n)?.read ?? "";
    setThinking(true);
    try {
      const res = await fetch("/api/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n, read, messages: history.slice(-10) }),
      });
      const { reply } = (await res.json()) as HelperResponse;
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Hozir javob bera olmadim. Birozdan keyin yana so'rab ko'r." }]);
    } finally {
      setThinking(false);
    }
  }

  function choose(n: number) {
    setSelectedN(n);
    setMessages([]);
    void ask(n, []);
  }

  function send() {
    const text = input.trim();
    if (!text || selectedN === null || thinking) return;
    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    void ask(selectedN, history);
  }

  if (!mistakes.length) {
    return (
      <Card>
        <p className="font-semibold">Oxirgi tekshiruvda xato yo'q. Barakalla!</p>
        <p className="mt-1 text-sm text-ink-soft">Savol tug'ilsa, keyingi tekshiruvdan so'ng shu yerga qayt.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardLabel className="mb-3">Oxirgi tekshiruvdagi xatolaring</CardLabel>
        <ul className="flex flex-col gap-2">
          {mistakes.map((m) => {
            const q = worksheet.questions.find((x) => x.n === m.n)!;
            return (
              <li key={m.n}>
                <button
                  type="button"
                  onClick={() => choose(m.n)}
                  aria-pressed={selectedN === m.n}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                    selectedN === m.n ? "border-ink bg-paper" : "border-grid bg-surface hover:border-ink-soft",
                  )}
                >
                  <span className="font-display text-sm font-semibold text-ink-soft">{m.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{q.text}</span>
                    <span className="block truncate text-xs text-ink-soft">{skillName(q.skillId)}</span>
                  </span>
                  <span className="font-display font-semibold text-wrong line-through decoration-2">{m.read || "—"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {selected && (
        <Card className="flex flex-col gap-3">
          <CardLabel className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden />
            Maslahatchi
          </CardLabel>
          <div className="flex flex-col gap-3" aria-live="polite">
            {messages.map((m, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[90%] whitespace-pre-line rounded-[12px] px-3 py-2 text-sm leading-relaxed",
                  m.role === "assistant" ? "self-start bg-paper" : "self-end bg-accent text-white",
                )}
              >
                {m.content}
              </p>
            ))}
            {thinking && <p className="self-start text-sm text-ink-soft">Maslahatchi o'ylayapti...</p>}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Savolingni yoz..."
              aria-label="Savol"
              className="h-11 min-w-0 flex-1 rounded-[12px] border border-grid bg-surface px-3 text-sm focus:border-accent focus:outline-none"
            />
            <Button type="submit" size="lg" disabled={thinking || !input.trim()} aria-label="Yuborish" className="px-4">
              <Send aria-hidden />
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
