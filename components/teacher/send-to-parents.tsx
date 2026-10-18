"use client";

import { useState } from "react";
import { CheckCircle2, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatTelegramMessage } from "@/lib/parent-messages";
import type { ParentMessage } from "@/lib/types";
import type { TelegramResponse } from "@/app/api/telegram/route";
import { useT } from "@/lib/i18n/locale";

// Telegram allows roughly one message per second per chat.
const PAUSE_MS = 1100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type State =
  | { kind: "idle" }
  | { kind: "sending"; sent: number }
  | { kind: "done"; sent: number; failed: number; demo: boolean }
  | { kind: "error"; message: string; sent: number };

async function sendOne(m: ParentMessage): Promise<TelegramResponse> {
  const res = await fetch("/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });
  return (await res.json()) as TelegramResponse;
}

export function SendToParents({ messages }: { messages: ParentMessage[] }) {
  const t = useT();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [showAll, setShowAll] = useState(false);

  async function send() {
    let sent = 0;
    let failed = 0;
    let demo = false;
    setState({ kind: "sending", sent });

    for (const [i, m] of messages.entries()) {
      let result = await sendOne(m).catch((): TelegramResponse => ({ ok: false, error: "Tarmoq xatosi" }));
      if (!result.ok && result.retryAfter) {
        await sleep(result.retryAfter * 1000);
        result = await sendOne(m).catch((): TelegramResponse => ({ ok: false, error: "Tarmoq xatosi" }));
      }
      if (!result.ok && result.error === "Telegram sozlanmagan") {
        setState({ kind: "error", message: t.parentsSend.notConfigured, sent });
        return;
      }
      if (result.ok) {
        sent++;
        demo ||= Boolean(result.demo);
      } else failed++;
      setState({ kind: "sending", sent: sent + failed });
      if (i < messages.length - 1 && !demo) await sleep(PAUSE_MS);
    }
    setState({ kind: "done", sent, failed, demo });
  }

  if (!messages.length) return null;
  const preview = showAll ? messages : messages.slice(0, 1);

  return (
    <Card>
      <CardLabel className="mb-2">{t.parentsSend.title}</CardLabel>
      <p className="mb-4 text-sm text-ink-soft">
        {t.parentsSend.ready(messages.length)} {t.parentsSend.note}
      </p>

      <ul className="mb-4 flex flex-col gap-2">
        {preview.map((m) => (
          <li
            key={m.studentId}
            className="whitespace-pre-line rounded-[12px] border border-grid bg-paper p-3 text-sm leading-relaxed"
          >
            {formatTelegramMessage(m.studentId, m.text)}
          </li>
        ))}
      </ul>
      {messages.length > 1 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mb-4 text-sm font-semibold text-accent"
        >
          {showAll ? t.parentsSend.collapse : t.parentsSend.showAll(messages.length)}
        </button>
      )}

      {state.kind === "sending" && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-sm font-semibold tabular-nums">
            {t.parentsSend.sending(state.sent, messages.length)}
          </p>
          <Progress value={state.sent} max={messages.length} label={t.parentsSend.button} />
        </div>
      )}

      {state.kind === "done" && (
        <p className="flex items-start gap-2 text-sm font-semibold text-correct" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.demo
            ? t.parentsSend.demoDone(state.sent)
            : t.parentsSend.done(state.sent, state.failed)}
        </p>
      )}

      {state.kind === "error" && (
        <p className="flex items-start gap-2 text-sm font-semibold text-wrong" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      {(state.kind === "idle" || state.kind === "error") && (
        <Button size="lg" className="mt-2 w-full sm:w-auto" onClick={send}>
          <Send aria-hidden />
          {t.parentsSend.button}
        </Button>
      )}
    </Card>
  );
}
