"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CurrentUser } from "@/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

const NAV_LINK = `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-300 ${FOCUS_RING}`;

function RoleBadge({ role }: Pick<CurrentUser, "role">) {
  const t = useTranslations("nav");
  const isManager = role === "MANAGER";
  const Icon = isManager ? ShieldCheck : User;

  return (
    <span
      data-testid="user-role"
      data-role={role}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isManager
          ? "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30"
          : "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30"
      }`}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {t(`roles.${role}`)}
    </span>
  );
}

function UserMenu({ user }: { user: CurrentUser }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      data-testid="user-menu"
      className="flex min-w-0 items-center gap-2 rounded-full bg-slate-100 py-1 pr-1 pl-3 ring-1 ring-slate-200/70 ring-inset dark:bg-slate-900 dark:ring-slate-800"
    >
      <span
        data-testid="user-email"
        title={user.email}
        className="hidden max-w-[11rem] truncate text-sm font-medium text-slate-700 md:inline dark:text-slate-200"
      >
        {user.email}
      </span>
      <RoleBadge role={user.role} />
      <button
        type="button"
        data-testid="logout"
        disabled={isPending}
        // A full redirect clears every view of the signed-in user at once.
        onClick={() => startTransition(() => signOut({ callbackUrl: `/${locale}/login` }))}
        title={t("logout")}
        className={`flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:text-red-700 active:scale-95 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:text-red-300 ${FOCUS_RING}`}
      >
        <LogOut aria-hidden="true" className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="sr-only sm:not-sr-only">{t("logout")}</span>
      </button>
    </div>
  );
}

export default function Navbar({ user }: { user: CurrentUser | null }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/75 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:px-6 sm:py-3.5">
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

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
          {user?.role === "MANAGER" && (
            <Link
              href="/manager"
              data-testid="nav-manager-dashboard"
              title={t("managerDashboard")}
              className={NAV_LINK}
            >
              <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{t("managerDashboard")}</span>
            </Link>
          )}

          {!user && (
            <>
              <Link href="/login" data-testid="nav-login" className={NAV_LINK}>
                <LogIn aria-hidden="true" className="h-4 w-4" />
                {t("login")}
              </Link>
              <Link href="/register" data-testid="nav-register" className={NAV_LINK}>
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                {t("register")}
              </Link>
            </>
          )}

          <LanguageSwitcher />
          <ThemeSwitcher />
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
