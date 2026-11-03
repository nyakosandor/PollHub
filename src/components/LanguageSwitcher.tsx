"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale, routing } from "@/i18n/routing";

/** Switches the URL to the same page in another locale, e.g. /hu/manager → /en/manager. */
export default function LanguageSwitcher() {
  const t = useTranslations("nav");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (locale: Locale) => {
    if (locale === activeLocale) return;
    startTransition(() => {
      // `pathname` comes without the locale prefix, e.g. /polls/poll-1.
      router.replace(pathname, { locale });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      data-testid="language-switcher"
      className={`flex items-center gap-0.5 rounded-full bg-slate-100 p-1 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Languages aria-hidden="true" className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-slate-400" />
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          onClick={() => switchTo(locale)}
          disabled={isPending}
          aria-pressed={locale === activeLocale}
          aria-label={t(`languages.${locale}`)}
          title={t(`languages.${locale}`)}
          data-testid={`locale-switch-${locale}`}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            locale === activeLocale
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
