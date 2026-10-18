"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typing for the Web Speech API (not in lib.dom for every TS version).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

/** Continuous browser speech recognition; restarts itself after Chrome's silence timeouts. */
export function useSpeech(lang: string) {
  const supported = useSyncExternalStore(noop, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);

  const stop = useCallback(() => {
    wanted.current = false;
    rec.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setFinalText("");
    setInterim("");
    setError(null);

    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interimText = "";
      let finals = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finals += res[0].transcript + " ";
        else interimText += res[0].transcript;
      }
      if (finals) setFinalText((t) => t + finals);
      setInterim(interimText);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      setError(e.error);
      setListening(false);
    };
    r.onend = () => {
      if (wanted.current) r.start();
      else setListening(false);
    };
    rec.current = r;
    wanted.current = true;
    r.start();
    setListening(true);
  }, [lang]);

  useEffect(() => () => {
    wanted.current = false;
    rec.current?.stop();
  }, []);

  return { supported, listening, transcript: finalText, interim, error, start, stop };
}
