import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "@/i18n/routing";
import CreatePollForm from "@/components/CreatePollForm";
import PollList from "@/components/PollList";
import { getPollSummaries, requireRole } from "@/lib/dal";
import { PAGE_SUBTITLE, PAGE_TITLE, SECTION_TITLE } from "@/lib/ui";

export default async function ManagerPage({ params }: PageProps<"/[locale]/manager">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // Participants are sent to the home page.
  const user = await requireRole("MANAGER");
  const [t, polls] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "manager" }),
    getPollSummaries(user.id),
  ]);

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <header>
        <h1 className={PAGE_TITLE}>{t("title")}</h1>
        <p className={PAGE_SUBTITLE}>{t("subtitle")}</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className={SECTION_TITLE}>{t("createHeading")}</h2>
        <CreatePollForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={SECTION_TITLE}>{t("allPolls")}</h2>
        <PollList polls={polls} role={user.role} />
      </section>
    </div>
  );
}
