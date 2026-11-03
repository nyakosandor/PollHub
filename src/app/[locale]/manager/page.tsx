"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePolls } from "@/context/PollContext";
import CreatePollForm from "@/components/CreatePollForm";
import PollList from "@/components/PollList";
import { PAGE_SUBTITLE, PAGE_TITLE, SECTION_TITLE } from "@/lib/ui";

export default function ManagerPage() {
  const t = useTranslations("manager");
  const { role, isHydrated } = usePolls();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && role !== "Manager") {
      router.replace("/");
    }
  }, [isHydrated, role, router]);

  if (!isHydrated || role !== "Manager") {
    return null;
  }

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
        <PollList />
      </section>
    </div>
  );
}
