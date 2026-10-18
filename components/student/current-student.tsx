"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_STUDENT_ID, getStudent } from "@/lib/data";

// The demo has no login: the chosen student lives in localStorage.
const KEY = "daftar.studentId";
const listeners = new Set<() => void>();

function read(): string {
  try {
    const id = localStorage.getItem(KEY);
    return id && getStudent(id) ? id : DEFAULT_STUDENT_ID;
  } catch {
    return DEFAULT_STUDENT_ID;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function setCurrentStudentId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Storage may be blocked (private mode); the default student is still usable.
  }
  listeners.forEach((l) => l());
}

export function useCurrentStudent() {
  const id = useSyncExternalStore(subscribe, read, () => DEFAULT_STUDENT_ID);
  const select = useCallback((next: string) => setCurrentStudentId(next), []);
  return { student: getStudent(id)!, select };
}
