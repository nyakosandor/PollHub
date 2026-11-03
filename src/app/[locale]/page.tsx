import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "@/i18n/routing";
import PollList from "@/components/PollList";
import { PAGE_SUBTITLE, PAGE_TITLE } from "@/lib/ui";

export default async function DashboardPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "dashboard" });

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <header>
        <h1 className={PAGE_TITLE}>{t("title")}</h1>
        <p className={PAGE_SUBTITLE}>{t("subtitle")}</p>
      </header>
      <PollList />
    </div>
  );
}
