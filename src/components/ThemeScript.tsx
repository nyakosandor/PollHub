"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { applyStoredTheme } from "@/lib/themeStore";

const noopSubscribe = () => () => {};

/**
 * Applies the saved theme to <html> before the first paint.
 *
 * In server HTML the inline script runs while the page is parsed. When React
 * instead creates <html> on the client (switching locale re-renders the root
 * layout, as does the not-found page) a <script> would never run and React
 * warns about it, so the layout effect applies the theme before paint instead.
 */
export default function ThemeScript() {
  // true while rendering on the server and hydrating its HTML, false for a
  // fresh client render.
  const isServerHtml = useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true
  );

  useLayoutEffect(() => {
    applyStoredTheme();
  });

  return isServerHtml ? (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ) : null;
}
