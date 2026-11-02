"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usePolls } from "@/context/PollContext";
import { formatClosingTime } from "@/lib/closingTime";
import { pluralize } from "@/lib/format";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import ClosePollButton from "@/components/ClosePollButton";
import VoteForm from "@/components/VoteForm";
import ResultsChart from "@/components/ResultsChart";
import AIInsights from "@/components/AIInsights";
import { ArrowLeft } from "lucide-react";

export default function PollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    getPoll,
    getPollQuestion,
    getResults,
    getTotalVotes,
    isPollClosed,
    role,
    isHydrated,
  } = usePolls();

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
  const results = getResults(question.id);
  const totalVotes = getTotalVotes(question.id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to polls
      </Link>

      <Card>
        <div className="mb-3">
          <StatusBadge isClosed={isClosed} />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{poll.title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {isClosed ? "Closed" : "Closes"} {formatClosingTime(poll.closesAt)}
        </p>
        {role === "Manager" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <ClosePollButton poll={poll} />
          </div>
        )}
      </Card>

      {role === "Participant" && (
        <Card title="Cast your vote">
          <VoteForm poll={poll} question={question} />
        </Card>
      )}

      <Card
        title="Results"
        action={
          <span className="text-xs text-slate-500">
            {pluralize(totalVotes, "total vote")}
          </span>
        }
      >
        <p className="mb-3 text-sm text-slate-700">{question.text}</p>
        <ResultsChart results={results} totalVotes={totalVotes} />
      </Card>

      <AIInsights
        question={question}
        results={results}
        totalVotes={totalVotes}
      />
    </div>
  );
}
