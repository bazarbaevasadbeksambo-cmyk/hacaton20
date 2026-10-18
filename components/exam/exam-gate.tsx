"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanFace, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { WorkSolver, type SolvableWork } from "@/components/student/work-solver";
import { useCurrentStudent } from "@/components/student/current-student";
import { FocusTracker, type FocusState } from "@/lib/focus-tracker";
import { cn } from "@/lib/utils";

type Phase =
  | { kind: "consent" }
  | { kind: "starting" }
  | { kind: "calibrate"; counting: number | null }
  | { kind: "running" }
  | { kind: "plain"; reason?: string }; // no camera: ordinary mode, no errors

const STATUS: Record<FocusState, { text: string; dot: string }> = {
  ok: { text: "Fokus joyida", dot: "bg-correct" },
  away: { text: "Ekranga qarang", dot: "bg-unsure" },
  noface: { text: "Yuz ko'rinmayapti", dot: "bg-unsure" },
};

/** Exam mode wrapper: consent → camera → calibration → work with a quiet focus indicator. */
export function ExamGate({ work }: { work: SolvableWork }) {
  const [phase, setPhase] = useState<Phase>({ kind: "consent" });
  const [focusState, setFocusState] = useState<FocusState>("ok");
  const [alert, setAlert] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<FocusTracker | null>(null);

  const shutdown = useCallback(() => {
    trackerRef.current?.dispose();
    trackerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => shutdown, [shutdown]);

  // Already handed in: no camera needed, just show the result.
  const { student } = useCurrentStudent();
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/homework?studentId=${student.id}&workId=${work.id}`)
      .then((r) => r.json() as Promise<{ submissions: unknown[] }>)
      .then(({ submissions }) => {
        if (!cancelled && submissions.length) setPhase({ kind: "plain" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [student.id, work.id]);

  async function enable() {
    setPhase({ kind: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const tracker = new FocusTracker(video);
      await tracker.load();
      trackerRef.current = tracker;
      setPhase({ kind: "calibrate", counting: null });
    } catch {
      shutdown();
      setPhase({ kind: "plain", reason: "Kamera ishlamadi — ish oddiy rejimda davom etadi." });
    }
  }

  async function calibrate() {
    const tracker = trackerRef.current;
    if (!tracker) return;
    for (let s = 3; s > 0; s--) {
      setPhase({ kind: "calibrate", counting: s });
      if (s === 3) void tracker.calibrate(3000).then(onCalibrated);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  function onCalibrated(ok: boolean) {
    const tracker = trackerRef.current;
    if (!ok || !tracker) {
      setPhase({ kind: "calibrate", counting: null });
      return;
    }
    tracker.start((state, isAlert) => {
      setFocusState(state);
      setAlert(isAlert);
    });
    setPhase({ kind: "running" });
  }

  const running = phase.kind === "running";

  return (
    <div className="flex flex-col gap-4">
      {/* Local camera feed for landmark detection only — never shown, stored or uploaded. */}
      <video ref={videoRef} muted playsInline aria-hidden className="pointer-events-none fixed left-0 top-0 size-px opacity-0" />

      {phase.kind === "consent" && (
        <Card className="flex flex-col gap-4">
          <CardLabel className="flex items-center gap-1.5">
            <ScanFace className="size-4" aria-hidden />
            Imtihon rejimi
          </CardLabel>
          <p className="text-lg font-semibold leading-snug">
            Imtihon rejimi: kamera faqat sizning qurilmangizda ishlaydi, video saqlanmaydi va hech kimga yuborilmaydi
          </p>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-correct" aria-hidden />
              O'qituvchi faqat sonni ko'radi: necha marta va qancha vaqt ekrandan chalg'idingiz.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-correct" aria-hidden />
              Daftarga pastga qarash — normal holat, u hisoblanmaydi.
            </li>
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" onClick={enable}>
              <Camera aria-hidden />
              Roziman, kamerani yoqish
            </Button>
            <Button size="lg" variant="ghost" onClick={() => setPhase({ kind: "plain" })}>
              <CameraOff aria-hidden />
              Kamerasiz davom etish
            </Button>
          </div>
        </Card>
      )}

      {phase.kind === "starting" && (
        <Card>
          <p className="font-semibold">Kamera yoqilmoqda...</p>
          <p className="text-sm text-ink-soft">Brauzer ruxsat so'rasa, «Ruxsat berish»ni bosing.</p>
        </Card>
      )}

      {phase.kind === "calibrate" && (
        <Card className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="font-semibold">Ekranga to'g'ri qarang va tugmani bosing</p>
          {phase.counting ? (
            <p className="font-display text-6xl font-semibold text-accent tabular-nums" aria-live="assertive">
              {phase.counting}
            </p>
          ) : (
            <Button size="lg" onClick={calibrate}>
              Kalibrlash
            </Button>
          )}
          <p className="text-xs text-ink-soft">3 soniya — shu holat «markaz» deb olinadi.</p>
        </Card>
      )}

      {phase.kind === "plain" && phase.reason && (
        <p className="rounded-[12px] bg-paper px-4 py-3 text-sm text-ink-soft" role="status">
          {phase.reason}
        </p>
      )}

      {(running || phase.kind === "plain") && (
        <WorkSolver
          work={work}
          focus={running ? { active: true, summary: () => trackerRef.current?.summary() ?? { episodes: 0, totalSeconds: 0 } } : undefined}
          onSubmitted={shutdown}
        />
      )}

      {running && alert && (
        <p
          role="alert"
          className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-[12px] border border-unsure bg-unsure-soft px-4 py-3 text-center text-sm font-semibold text-unsure-ink"
        >
          Diqqatingizni ekranga qarating
        </p>
      )}

      {running && (
        <p className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-grid bg-surface px-3 py-1.5 text-xs font-semibold md:bottom-6">
          <span className={cn("size-2 rounded-full", STATUS[focusState].dot)} aria-hidden />
          {STATUS[focusState].text}
        </p>
      )}
    </div>
  );
}
