"use client";

import { useState } from "react";
import { PollResult, Question } from "@/types";
import { buildInsightSummary } from "@/lib/insights";
import { useTimeout } from "@/lib/useTimeout";
import { Sparkles, Loader2 } from "lucide-react";

const SIMULATED_LATENCY_MS = 1400;

interface AIInsightsProps {
  question: Question;
  results: PollResult[];
  totalVotes: number;
}

type InsightStatus = "idle" | "loading" | "done";

export default function AIInsights({ question, results, totalVotes }: AIInsightsProps) {
  const [status, setStatus] = useState<InsightStatus>("idle");
  const [summary, setSummary] = useState("");
  const scheduleTimeout = useTimeout();

  const generateSummary = () => {
    setStatus("loading");
    scheduleTimeout(() => {
      setSummary(buildInsightSummary(question, results, totalVotes));
      setStatus("done");
    }, SIMULATED_LATENCY_MS);
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">AI Insights</h3>
          <p className="text-xs text-slate-500">Simulated summary of poll results</p>
        </div>
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={generateSummary}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate AI Summary
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing responses...
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          <button
            type="button"
            onClick={generateSummary}
            className="self-start text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
