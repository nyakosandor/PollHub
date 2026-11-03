"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Clock, Lock, LucideIcon, Trophy, Users } from "lucide-react";
import { Poll, PollResult } from "@/types";
import { usePolls } from "@/context/PollContext";
import { getTimeRemaining } from "@/lib/closingTime";
import { toPercent } from "@/lib/format";
import { getLeaders } from "@/lib/results";
import { useNow } from "@/lib/useNow";

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
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      <div className="text-xl font-semibold break-words text-slate-900">
        {value}
      </div>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function TimeRemainingCard({ poll }: { poll: Poll }) {
  const t = useTranslations("kpi");
  const { isPollClosed } = usePolls();
  const now = useNow(COUNTDOWN_REFRESH_MS);

  return isPollClosed(poll) ? (
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
      value={t("closesIn", getTimeRemaining(poll.closesAt, now))}
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
