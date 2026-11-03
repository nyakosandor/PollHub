import { useTranslations } from "next-intl";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BUTTON_SECONDARY } from "@/lib/ui";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div
      data-testid="not-found"
      className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
    >
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <SearchX aria-hidden="true" className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </span>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {t("description")}
      </p>
      <Link href="/" className={`${BUTTON_SECONDARY} mt-7`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t("back")}
      </Link>
    </div>
  );
}
