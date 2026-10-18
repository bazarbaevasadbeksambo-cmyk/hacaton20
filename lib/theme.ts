"use client";

import { useSyncExternalStore } from "react";

import { THEME_KEY } from "./theme-script";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
