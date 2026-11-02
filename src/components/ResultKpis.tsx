"use client";

import { Clock, Lock, LucideIcon, Trophy, Users } from "lucide-react";
import { Poll, PollResult } from "@/types";
import { usePolls } from "@/context/PollContext";
import { formatTimeRemaining } from "@/lib/closingTime";
import { formatList, pluralize, toPercent } from "@/lib/format";
import { getLeaders } from "@/lib/results";
import { useNow } from "@/lib/useNow";

const COUNTDOWN_REFRESH_MS = 30 * 1000;

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  value: string | number;
  detail: string;
}

function KpiCard({ label, icon: Icon, value, detail }: KpiCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
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
  const { isPollClosed } = usePolls();
  const now = useNow(COUNTDOWN_REFRESH_MS);

  return isPollClosed(poll) ? (
    <KpiCard
      label="Time remaining"
      icon={Lock}
      value="Closed"
      detail="Voting has ended"
    />
  ) : (
    <KpiCard
      label="Time remaining"
      icon={Clock}
      value={formatTimeRemaining(poll.closesAt, now)}
      detail="Voting is open"
    />
  );
}

function describeLead(leaders: PollResult[], totalVotes: number) {
  if (leaders.length === 0) return "Waiting for the first vote";
  const share = toPercent(leaders[0].count, totalVotes);
  return leaders.length > 1 ? `Tied at ${share}% each` : `${share}% of votes`;
}

interface ResultKpisProps {
  poll: Poll;
  results: PollResult[];
  totalVotes: number;
}

export default function ResultKpis({ poll, results, totalVotes }: ResultKpisProps) {
  const leaders = getLeaders(results);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard
        label="Total votes"
        icon={Users}
        value={totalVotes}
        detail={`Across ${pluralize(results.length, "option")}`}
      />
      <KpiCard
        label="Leading option"
        icon={Trophy}
        value={
          leaders.length > 0
            ? formatList(leaders.map(({ option }) => option.text))
            : "No votes yet"
        }
        detail={describeLead(leaders, totalVotes)}
      />
      <TimeRemainingCard poll={poll} />
    </div>
  );
}
