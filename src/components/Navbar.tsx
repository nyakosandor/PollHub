"use client";

import { useTranslations } from "next-intl";
import { LucideIcon, ClipboardList, LayoutDashboard, ShieldCheck, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePolls } from "@/context/PollContext";
import { UserRole } from "@/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ROLE_OPTIONS: { role: UserRole; icon: LucideIcon }[] = [
  { role: "Participant", icon: User },
  { role: "Manager", icon: ShieldCheck },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const { role: activeRole, setRole } = usePolls();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label={t("home")}
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          PollHub
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {activeRole === "Manager" && (
            <Link
              href="/manager"
              data-testid="nav-manager-dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t("managerDashboard")}
            </Link>
          )}

          <div
            role="group"
            aria-label={t("roleSwitcher")}
            className="flex items-center gap-1 rounded-full bg-slate-100 p-1"
          >
            {ROLE_OPTIONS.map(({ role, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => setRole(role)}
                aria-pressed={role === activeRole}
                data-testid={`role-${role}`}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  role === activeRole
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(`roles.${role}`)}
              </button>
            ))}
          </div>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
