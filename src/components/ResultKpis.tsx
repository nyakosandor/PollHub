"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Clock, Lock, LucideIcon, Trophy, Users } from "lucide-react";
import { Poll, PollResult } from "@/types";
import { useIsClosed, useTimeRemaining } from "@/lib/clock";
import { toPercent } from "@/lib/format";
import { getLeaders } from "@/lib/results";

const COUNTDOWN_REFRESH_MS = 30 * 1000;

interface KpiCardProps {
  testId: string;
  label: string;
  icon: LucideIcon;
  value: string | number;
  detail: string;
}

function KpiCard({ testId, label, icon: Icon, value, detail }: KpiCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-testid={testId}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {label}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold tracking-tight break-words text-slate-900 tabular-nums dark:text-white">
        {value}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function TimeRemainingCard({ poll }: { poll: Poll }) {
  const t = useTranslations("kpi");
  const isClosed = useIsClosed(poll.closesAt);
  const timeRemaining = useTimeRemaining(poll.closesAt, COUNTDOWN_REFRESH_MS);

  return isClosed ? (
    <KpiCard
      testId="kpi-time-remaining"
      label={t("timeRemaining")}
      icon={Lock}
      value={t("closed")}
      detail={t("votingEnded")}
    />
  ) : (
    <KpiCard
      testId="kpi-time-remaining"
      label={t("timeRemaining")}
      icon={Clock}
      value={t("closesIn", timeRemaining)}
      detail={t("votingOpen")}
    />
  );
}

interface ResultKpisProps {
  poll: Poll;
  results: PollResult[];
  totalVotes: number;
}

export default function ResultKpis({ poll, results, totalVotes }: ResultKpisProps) {
  const t = useTranslations("kpi");
  const format = useFormatter();
  const leaders = getLeaders(results);

  const describeLead = () => {
    if (leaders.length === 0) return t("waitingForFirstVote");
    const share = toPercent(leaders[0].count, totalVotes);
    return leaders.length > 1 ? t("tied", { share }) : t("shareOfVotes", { share });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        testId="kpi-total-votes"
        label={t("totalVotes")}
        icon={Users}
        value={totalVotes}
        detail={t("acrossOptions", { count: results.length })}
      />
      <KpiCard
        testId="kpi-leading-option"
        label={t("leadingOption")}
        icon={Trophy}
        value={
          leaders.length > 0
            ? format.list(
                leaders.map(({ option }) => option.text),
                { type: "conjunction" }
              )
            : t("noVotesYet")
        }
        detail={describeLead()}
      />
      <TimeRemainingCard poll={poll} />
    </div>
  );
}
