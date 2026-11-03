"use client";

import { useTranslations } from "next-intl";
import { Poll, PollResult, Question } from "@/types";
import AIInsights from "@/components/AIInsights";
import Card from "@/components/Card";
import ResultKpis from "@/components/ResultKpis";
import ResultsChart from "@/components/ResultsChart";
import ResultsTable from "@/components/ResultsTable";

interface PollResultsProps {
  poll: Poll;
  question: Question;
  results: PollResult[];
  totalVotes: number;
}

export default function PollResults({ poll, question, results, totalVotes }: PollResultsProps) {
  const t = useTranslations("results");

  return (
    <div className="flex flex-col gap-6">
      <ResultKpis poll={poll} results={results} totalVotes={totalVotes} />

      <Card title={t("title")}>
        <p className="-mt-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
          {question.text}
        </p>
        <ResultsChart results={results} totalVotes={totalVotes} />
        {totalVotes > 0 && (
          <ResultsTable results={results} totalVotes={totalVotes} />
        )}
      </Card>

      {/* Remount on a new vote so the summary is generated for the new totals. */}
      <AIInsights key={totalVotes} pollId={poll.id} />
    </div>
  );
}
