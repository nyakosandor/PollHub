"use client";

import { useSyncExternalStore } from "react";
import { CHANGE_EVENT, STORAGE_KEY, ThemePreference } from "@/lib/theme";

const isForcedTheme = (value: unknown): value is "light" | "dark" =>
  value === "light" || value === "dark";

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isForcedTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** Mirrors a preference onto <html data-theme>; no attribute means "follow the system". */
function applyToDocument(preference: ThemePreference) {
  const root = document.documentElement;
  if (isForcedTheme(preference)) {
    root.setAttribute("data-theme", preference);
  } else {
    root.removeAttribute("data-theme");
  }
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Storage can be blocked; the choice then lasts for this page view only.
  }
  applyToDocument(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Re-applies the saved choice, e.g. after React re-created <html>. */
export function applyStoredTheme() {
  applyToDocument(readPreference());
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    // Another tab changed the theme: mirror it here.
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved theme choice; "system" during server rendering. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    () => "system"
  );
}
