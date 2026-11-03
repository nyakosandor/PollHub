"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePolls } from "@/context/PollContext";
import StatusBadge from "@/components/StatusBadge";
import { BarChart3, ChevronRight, CheckCircle2 } from "lucide-react";

export default function PollList() {
  const t = useTranslations("pollList");
  const { polls, hasVoted, isPollClosed, getPollQuestion, getTotalVotes } =
    usePolls();

  if (polls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {polls.map((poll) => {
        const question = getPollQuestion(poll.id);
        if (!question) return null;

        const isVoted = hasVoted(poll.id);
        const totalVotes = getTotalVotes(question.id);
        return (
          <Link
            key={poll.id}
            href={`/polls/${poll.id}`}
            data-testid={`poll-card-${poll.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge isClosed={isPollClosed(poll)} />
                {isVoted && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("voted")}
                  </span>
                )}
              </div>
              <h3 className="truncate font-medium text-slate-900">
                {poll.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <BarChart3 className="h-3 w-3" />
                {t("stats", {
                  votes: totalVotes,
                  options: question.options.length,
                })}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
          </Link>
        );
      })}
    </div>
  );
}
