import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "@/i18n/routing";
import PollList from "@/components/PollList";

export default async function DashboardPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "dashboard" });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>
      <PollList />
    </div>
  );
}
