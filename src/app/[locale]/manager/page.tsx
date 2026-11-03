"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePolls } from "@/context/PollContext";
import CreatePollForm from "@/components/CreatePollForm";
import PollList from "@/components/PollList";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          {t("createHeading")}
        </h2>
        <CreatePollForm />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          {t("allPolls")}
        </h2>
        <PollList />
      </div>
    </div>
  );
}
