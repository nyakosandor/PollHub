"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
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
  const t = useTranslations("insights");
  const format = useFormatter();
  const [isLoading, setIsLoading] = useState(true);
  const scheduleTimeout = useTimeout();

  useEffect(() => {
    scheduleTimeout(() => setIsLoading(false), SIMULATED_LATENCY_MS);
  }, [scheduleTimeout]);

  return (
    <section
      data-testid="ai-insights"
      className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-violet-50 p-6 shadow-sm sm:p-8 dark:border-primary-500/20 dark:from-primary-950/60 dark:via-slate-900 dark:to-violet-950/40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-500/15"
      />
      <div className="relative mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-md shadow-primary-600/25">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
        </div>
      </div>

      <div aria-live="polite" className="relative">
        {isLoading ? (
          <div data-testid="ai-insights-loading" className="flex flex-col gap-3">
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t("loading")}
            </p>
            <div
              aria-hidden="true"
              className="flex animate-pulse flex-col gap-2 motion-reduce:animate-none"
            >
              {SKELETON_LINE_WIDTHS.map((width) => (
                <div
                  key={width}
                  className={`h-3 rounded-full bg-primary-100 dark:bg-primary-500/20 ${width}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p
            data-testid="ai-insights-summary"
            className="text-[15px] leading-relaxed text-slate-700 transition-opacity duration-500 starting:opacity-0 dark:text-slate-300"
          >
            {buildInsightSummary(results, totalVotes, {
              t,
              formatList: (items) => format.list(items, { type: "conjunction" }),
            })}
          </p>
        )}
      </div>
    </section>
  );
}
