"use client";

import { useTranslations } from "next-intl";
import { LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { THEME_PREFERENCES, ThemePreference } from "@/lib/theme";
import { setThemePreference, useThemePreference } from "@/lib/themeStore";

const ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/** Light, dark, or follow the operating system. */
export default function ThemeSwitcher() {
  const t = useTranslations("nav");
  const activePreference = useThemePreference();

  return (
    <div
      role="group"
      aria-label={t("theme")}
      data-testid="theme-switcher"
      className="flex items-center gap-0.5 rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/70 ring-inset dark:bg-slate-900 dark:ring-slate-800"
    >
      {THEME_PREFERENCES.map((preference) => {
        const Icon = ICONS[preference];
        const isActive = preference === activePreference;
        return (
          <button
            key={preference}
            type="button"
            onClick={() => setThemePreference(preference)}
            aria-pressed={isActive}
            aria-label={t(`themes.${preference}`)}
            title={t(`themes.${preference}`)}
            data-testid={`theme-${preference}`}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 dark:focus-visible:ring-offset-slate-950 ${
              isActive
                ? "bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-primary-300 dark:ring-slate-700"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
