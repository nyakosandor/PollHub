import { useTranslations } from "next-intl";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div
      data-testid="not-found"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <SearchX aria-hidden="true" className="h-8 w-8 text-slate-400" />
      <h1 className="text-lg font-semibold text-slate-900">{t("title")}</h1>
      <p className="max-w-sm text-sm text-slate-500">{t("description")}</p>
      <Link
        href="/"
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>
    </div>
  );
}
