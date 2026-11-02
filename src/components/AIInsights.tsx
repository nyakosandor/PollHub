"use client";

import { useEffect, useState } from "react";
import { PollResult } from "@/types";
import { buildInsightSummary } from "@/lib/insights";
import { useTimeout } from "@/lib/useTimeout";
import { Sparkles } from "lucide-react";

const SIMULATED_LATENCY_MS = 2000;
const SKELETON_LINE_WIDTHS = ["w-full", "w-11/12", "w-3/5"];

interface AIInsightsProps {
  results: PollResult[];
  totalVotes: number;
}

export default function AIInsights({ results, totalVotes }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const scheduleTimeout = useTimeout();

  useEffect(() => {
    scheduleTimeout(() => setIsLoading(false), SIMULATED_LATENCY_MS);
  }, [scheduleTimeout]);

  return (
    <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">AI Insights</h2>
          <p className="text-xs text-slate-500">
            Simulated summary of aggregated, fictitious responses
          </p>
        </div>
      </div>

      <div aria-live="polite">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium text-indigo-700">
              Generating AI insights...
            </p>
            <div
              aria-hidden="true"
              className="flex animate-pulse flex-col gap-2 motion-reduce:animate-none"
            >
              {SKELETON_LINE_WIDTHS.map((width) => (
                <div
                  key={width}
                  className={`h-3 rounded-full bg-indigo-100 ${width}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-700 transition-opacity duration-500 starting:opacity-0">
            {buildInsightSummary(results, totalVotes)}
          </p>
        )}
      </div>
    </section>
  );
}
