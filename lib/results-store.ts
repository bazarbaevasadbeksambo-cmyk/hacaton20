"use client";

import { useSyncExternalStore } from "react";
import { demoResults } from "./data";
import type { Group, ParentMessage, SheetResult } from "./types";

// Latest check of the class, written by /teacher/upload and read by /teacher/class.
// Lives in sessionStorage; without an upload the page shows today's demo results.

export type LatestCheck = {
  date: string;
  results: SheetResult[];
  /** AI-written group tasks, once /api/groups has run. */
  groups?: Group[];
  /** AI-written messages to parents, once /api/groups has run. */
  parentMessages?: ParentMessage[];
  /** How many sheets came from photos (the rest of the class keeps the day's data). */
  uploadedCount?: number;
};

const KEY = "daftar.latestCheck";
const FALLBACK: LatestCheck = { date: demoResults.date, results: demoResults.results };
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedValue: LatestCheck = FALLBACK;

function read(): LatestCheck {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return FALLBACK;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as LatestCheck) : FALLBACK;
  } catch {
    cachedValue = FALLBACK;
  }
  return cachedValue;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveLatestCheck(check: LatestCheck) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(check));
  } catch {
    // Storage unavailable: the page falls back to demo results.
  }
  listeners.forEach((l) => l());
}

export function useLatestCheck(): LatestCheck {
  return useSyncExternalStore(subscribe, read, () => FALLBACK);
}
