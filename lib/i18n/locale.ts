"use client";

import { useSyncExternalStore } from "react";
import { dictionaries, type Dict, type Locale } from "./dict";

const KEY = "daftar.locale";
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    return localStorage.getItem(KEY) === "ru" ? "ru" : "uz";
  } catch {
    return "uz";
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

export function setLocale(locale: Locale) {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    // Storage blocked: the choice still applies until reload.
  }
  document.documentElement.lang = locale;
  listeners.forEach((l) => l());
}

/** Uzbek on the server and on first paint, then the stored choice. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => "uz");
}

export function useT(): Dict {
  return dictionaries[useLocale()];
}
