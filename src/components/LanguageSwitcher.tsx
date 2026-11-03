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
      className={`flex items-center gap-0.5 rounded-full bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70 transition-opacity duration-200 dark:bg-slate-900 dark:ring-slate-800 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Languages
        aria-hidden="true"
        className="mr-0.5 ml-1.5 hidden h-3.5 w-3.5 text-slate-400 sm:block dark:text-slate-500"
      />
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
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 dark:focus-visible:ring-offset-slate-950 ${
            locale === activeLocale
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-primary-300 dark:ring-slate-700"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
