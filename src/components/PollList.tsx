"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import StatusBadge from "@/components/StatusBadge";
import { useIsClosed } from "@/lib/clock";
import { PollSummary, UserRole } from "@/types";
import { BarChart3, ChevronRight, CheckCircle2, Inbox } from "lucide-react";

function EmptyState({ role }: { role: UserRole }) {
  const t = useTranslations("pollList");

  return (
    <div
      data-testid="poll-list-empty"
      className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center sm:py-16 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <div className="relative mb-5">
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-150 rounded-full bg-primary-500/10 blur-xl dark:bg-primary-400/10"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <Inbox aria-hidden="true" className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {t("empty")}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {role === "MANAGER" ? t("emptyManagerHint") : t("emptyHint")}
      </p>
    </div>
  );
}

function PollCard({ poll, optionCount, totalVotes, hasVoted }: PollSummary) {
  const t = useTranslations("pollList");
  const isClosed = useIsClosed(poll.closesAt);

  return (
    <Link
      href={`/polls/${poll.id}`}
      data-testid={`poll-card-${poll.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:translate-y-0 active:shadow-sm motion-reduce:hover:translate-y-0 sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/50 dark:focus-visible:ring-offset-slate-950"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <StatusBadge isClosed={isClosed} />
          {hasVoted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/30">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
              {t("voted")}
            </span>
          )}
        </div>
        <h3 className="truncate text-base font-semibold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-primary-700 sm:text-lg dark:text-white dark:group-hover:text-primary-300">
          {poll.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" />
          {t("stats", { votes: totalVotes, options: optionCount })}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-primary-50 group-hover:text-primary-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-primary-500/15 dark:group-hover:text-primary-300"
      >
        <ChevronRight className="h-5 w-5" />
      </span>
    </Link>
  );
}

interface PollListProps {
  polls: PollSummary[];
  /** Picks the empty-state hint. */
  role: UserRole;
}

export default function PollList({ polls, role }: PollListProps) {
  if (polls.length === 0) {
    return <EmptyState role={role} />;
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {polls.map((summary) => (
        <PollCard key={summary.poll.id} {...summary} />
      ))}
    </div>
  );
}
