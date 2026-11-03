/** Shared Tailwind class lists, so buttons and inputs look the same everywhere. */

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

const BUTTON_BASE = `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:active:scale-100 ${FOCUS_RING}`;

export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-primary-600 px-5 py-2.5 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-500 hover:shadow-md hover:shadow-primary-600/25 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500`;

export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-slate-200 bg-white px-4 py-2.5 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800`;

export const BUTTON_GHOST = `${BUTTON_BASE} px-3 py-2 text-primary-600 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-950/50 dark:hover:text-primary-300`;

export const ICON_BUTTON = `inline-flex shrink-0 items-center justify-center rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-90 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 ${FOCUS_RING}`;

export const LINK_SUBTLE = `inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 ${FOCUS_RING}`;

export const INPUT =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-primary-400 dark:focus:ring-primary-400/20";

export const LABEL =
  "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

export const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const PAGE_TITLE =
  "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white";

export const PAGE_SUBTITLE =
  "mt-2 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400";

export const SECTION_TITLE =
  "text-base font-semibold tracking-tight text-slate-900 dark:text-white";
