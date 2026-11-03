/** Server-safe theme constants, shared by the root layout and the client store. */

export type ThemePreference = "system" | "light" | "dark";

export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

export const STORAGE_KEY = "pollhub_theme";
export const CHANGE_EVENT = "pollhub-theme-change";

/**
 * Runs in <head> before the first paint, so a saved light or dark choice is
 * applied without a flash of the other theme. Kept dependency-free on purpose.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
