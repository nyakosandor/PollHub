"use client";

import { useTranslations } from "next-intl";
import { LucideIcon, ClipboardList, LayoutDashboard, ShieldCheck, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePolls } from "@/context/PollContext";
import { UserRole } from "@/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const ROLE_OPTIONS: { role: UserRole; icon: LucideIcon }[] = [
  { role: "Participant", icon: User },
  { role: "Manager", icon: ShieldCheck },
];

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

export default function Navbar() {
  const t = useTranslations("nav");
  const { role: activeRole, setRole } = usePolls();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/75 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:py-3.5 sm:px-6">
        <Link
          href="/"
          aria-label={t("home")}
          className={`group flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight text-slate-900 dark:text-white ${FOCUS_RING}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-sm shadow-primary-600/30 transition-transform duration-200 group-hover:scale-105">
            <ClipboardList aria-hidden="true" className="h-4.5 w-4.5" />
          </span>
          PollHub
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {activeRole === "Manager" && (
            <Link
              href="/manager"
              data-testid="nav-manager-dashboard"
              title={t("managerDashboard")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-300 ${FOCUS_RING}`}
            >
              <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{t("managerDashboard")}</span>
            </Link>
          )}

          <div
            role="group"
            aria-label={t("roleSwitcher")}
            className="flex items-center gap-0.5 rounded-full bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            {ROLE_OPTIONS.map(({ role, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => setRole(role)}
                aria-pressed={role === activeRole}
                data-testid={`role-${role}`}
                title={t(`roles.${role}`)}
                className={`flex items-center gap-1.5 rounded-full py-1.5 px-2.5 text-sm font-medium transition-all duration-200 active:scale-95 sm:px-3 ${FOCUS_RING} ${
                  role === activeRole
                    ? "bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-primary-300 dark:ring-slate-700"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only sm:not-sr-only">{t(`roles.${role}`)}</span>
              </button>
            ))}
          </div>

          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
