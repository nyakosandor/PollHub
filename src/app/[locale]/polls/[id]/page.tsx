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
import { LINK_SUBTLE } from "@/lib/ui";
import { ArrowLeft, CalendarClock } from "lucide-react";

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
      <Link href="/" className={`group ${LINK_SUBTLE}`}>
        <ArrowLeft
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        {t("back")}
      </Link>

      <Card>
        <div className="mb-4">
          <StatusBadge isClosed={isClosed} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {poll.title}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <CalendarClock aria-hidden="true" className="h-4 w-4" />
          {t("closingTime", {
            isClosed: String(isClosed),
            date: formatClosingTime(poll.closesAt, locale),
          })}
        </p>
        {role === "Manager" && (
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
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
