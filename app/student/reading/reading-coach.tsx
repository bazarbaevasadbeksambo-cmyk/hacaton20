"use client";

import { useState } from "react";
import { Mic, PlayCircle, RotateCcw, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { useSpeech } from "@/components/student/use-speech";
import { readingDemo, readingTexts } from "@/lib/data";
import { compareReading, type WordMark } from "@/lib/reading";
import type { ReadingLang } from "@/lib/types";
import type { ReadingQuestionsResponse } from "@/app/api/reading/route";
import { cn } from "@/lib/utils";

const LANGS: { id: ReadingLang; label: string; speech: string }[] = [
  { id: "uz", label: "O'zbekcha", speech: "uz-UZ" },
  { id: "ru", label: "Русский", speech: "ru-RU" },
  { id: "en", label: "English", speech: "en-US" },
];

// Used only to give the prerecorded sample a plausible duration.
const SAMPLE_WPM = 90;

type Result = { marks: WordMark[]; correct: number; total: number; wpm: number; sample: boolean };

const MARK_STYLE: Record<WordMark["status"], string> = {
  ok: "",
  missed: "rounded bg-grid px-0.5 text-ink-soft line-through",
  wrong: "rounded bg-wrong-soft px-0.5 text-wrong underline decoration-2 underline-offset-4",
};

export function ReadingCoach() {
  const [lang, setLang] = useState<ReadingLang>("uz");
  const langInfo = LANGS.find((l) => l.id === lang)!;
  const text = readingTexts.find((t) => t.lang === lang)!;
  const speech = useSpeech(langInfo.speech);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [questions, setQuestions] = useState<ReadingQuestionsResponse["questions"] | null>(null);
  const [shown, setShown] = useState<Record<number, boolean>>({});

  async function loadQuestions() {
    setQuestions(null);
    setShown({});
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      setQuestions(((await res.json()) as ReadingQuestionsResponse).questions);
    } catch {
      setQuestions([]);
    }
  }

  function finish(transcript: string, minutes: number, sample: boolean) {
    const cmp = compareReading(text.text, transcript);
    setResult({ ...cmp, wpm: Math.round(cmp.correct / Math.max(minutes, 0.05)), sample });
    void loadQuestions();
  }

  function begin() {
    setResult(null);
    setQuestions(null);
    setStartedAt(Date.now());
    speech.start();
  }

  function end() {
    speech.stop();
    const minutes = startedAt ? (Date.now() - startedAt) / 60000 : 1;
    finish(`${speech.transcript} ${speech.interim}`, minutes, false);
  }

  function playSample() {
    const sample = readingDemo[lang];
    finish(sample, sample.split(/\s+/).length / SAMPLE_WPM, true);
  }

  function reset(next?: ReadingLang) {
    if (speech.listening) speech.stop();
    if (next) setLang(next);
    setResult(null);
    setQuestions(null);
    setStartedAt(null);
  }

  const unavailable = !speech.supported || speech.error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="tablist" aria-label="Til">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={l.id === lang}
            onClick={() => reset(l.id)}
            className={cn(
              "flex-1 rounded-[12px] border px-3 py-2 text-sm font-semibold transition-colors sm:flex-none",
              l.id === lang ? "border-ink bg-ink text-on-ink" : "border-grid bg-surface hover:border-ink-soft",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <CardLabel>{text.title}</CardLabel>
          {result?.sample && <Badge tone="unsure">Namuna o'qish</Badge>}
        </div>
        <p className="text-lg leading-loose sm:text-xl" lang={lang}>
          {result
            ? result.marks.map((m, i) => (
                <span key={i}>
                  <span className={MARK_STYLE[m.status]}>{m.word}</span>{" "}
                </span>
              ))
            : text.text}
        </p>
        {speech.listening && (
          <p className="mt-4 rounded-[12px] bg-paper px-3 py-2 text-sm text-ink-soft" aria-live="polite">
            {speech.transcript}
            <span className="opacity-60">{speech.interim}</span>
            {!speech.transcript && !speech.interim && "Tinglayapman..."}
          </p>
        )}
      </Card>

      {result && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardLabel className="mb-1">To'g'ri o'qildi</CardLabel>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {result.correct}
              <span className="text-sm text-ink-soft"> / {result.total} so'z</span>
            </p>
          </Card>
          <Card>
            <CardLabel className="mb-1">Tezlik</CardLabel>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {result.wpm}
              <span className="text-sm text-ink-soft"> so'z/daq</span>
            </p>
          </Card>
          <ul className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <li>
              <span className={MARK_STYLE.missed}>so'z</span> — tushib qolgan
            </li>
            <li>
              <span className={MARK_STYLE.wrong}>so'z</span> — noto'g'ri o'qilgan
            </li>
          </ul>
        </div>
      )}

      {unavailable && !result && (
        <p className="rounded-[12px] bg-unsure-soft px-4 py-3 text-sm text-unsure-ink">
          {speech.error === "not-allowed"
            ? "Mikrofonga ruxsat berilmadi."
            : speech.error === "language-not-supported"
              ? "Bu brauzer tanlangan tilda ovozni taniy olmaydi."
              : speech.error
                ? "Ovozni tanishda xatolik yuz berdi."
                : "Bu brauzerda ovozni tanish ishlamaydi. Chrome brauzerida oching."}{" "}
          Namuna o'qish bilan qanday ishlashini ko'rishingiz mumkin.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!result && !speech.listening && speech.supported && (
          <Button size="lg" onClick={begin}>
            <Mic aria-hidden />
            O'qishni boshlash
          </Button>
        )}
        {speech.listening && (
          <Button size="lg" variant="danger" onClick={end}>
            <Square aria-hidden />
            Tugatdim
          </Button>
        )}
        {!result && !speech.listening && (
          <Button size="lg" variant={speech.supported && !speech.error ? "ghost" : "primary"} onClick={playSample}>
            <PlayCircle aria-hidden />
            Namuna o'qish (demo)
          </Button>
        )}
        {result && (
          <Button size="lg" variant="outline" onClick={() => reset()}>
            <RotateCcw aria-hidden />
            Qaytadan o'qish
          </Button>
        )}
      </div>

      {result && (
        <Card>
          <CardLabel className="mb-3">Matnni tushundingizmi?</CardLabel>
          {questions === null ? (
            <p className="text-sm text-ink-soft">Savollar tayyorlanmoqda...</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <li key={i} className="flex flex-col gap-2">
                  <p className="font-semibold" lang={lang}>
                    {i + 1}. {q.question}
                  </p>
                  <textarea
                    rows={2}
                    aria-label={`${i + 1}-savolga javob`}
                    className="rounded-[12px] border border-grid bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  {shown[i] ? (
                    <p className="rounded-[12px] bg-correct-soft px-3 py-2 text-sm text-correct" lang={lang}>
                      {q.answer}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShown((s) => ({ ...s, [i]: true }))}
                      className="self-start text-sm font-semibold text-accent"
                    >
                      Javobni solishtirish
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}
