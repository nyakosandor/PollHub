"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { usePolls } from "@/context/PollContext";
import { formatClosingTime } from "@/lib/closingTime";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import ClosePollButton from "@/components/ClosePollButton";
import VoteForm from "@/components/VoteForm";
import PollResults from "@/components/PollResults";
import { ArrowLeft } from "lucide-react";

export default function PollDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("poll");
  const locale = useLocale();
  const { getPoll, getPollQuestion, isPollClosed, role, isHydrated } = usePolls();

  // Polls created in the browser only exist after localStorage hydration,
  // so wait for it before deciding the poll is missing.
  if (!isHydrated) {
    return null;
  }

  const poll = getPoll(id);
  const question = getPollQuestion(id);

  if (!poll || !question) {
    notFound();
  }

  const isClosed = isPollClosed(poll);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <Card>
        <div className="mb-3">
          <StatusBadge isClosed={isClosed} />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{poll.title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {t("closingTime", {
            isClosed: String(isClosed),
            date: formatClosingTime(poll.closesAt, locale),
          })}
        </p>
        {role === "Manager" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <ClosePollButton poll={poll} />
          </div>
        )}
      </Card>

      {role === "Participant" && (
        <Card title={t("castVote")}>
          <VoteForm poll={poll} question={question} />
        </Card>
      )}

      <PollResults poll={poll} question={question} />
    </div>
  );
}
