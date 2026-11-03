"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, RotateCw, Sparkles } from "lucide-react";
import { generatePollInsights } from "@/actions/insights";

const SKELETON_LINE_WIDTHS = ["w-full", "w-11/12", "w-3/5"];

type InsightsState =
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error" };

interface AIInsightsProps {
  pollId: string;
}

/**
 * Shows Gemini's summary of the poll results. The model is called by a Server
 * Action, so the API key stays on the server. The parent remounts this
 * component on every new vote, which requests a fresh summary.
 */
export default function AIInsights({ pollId }: AIInsightsProps) {
  const t = useTranslations("insights");
  const locale = useLocale();
  const [state, setState] = useState<InsightsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ignores a response that arrives after the locale changed or the
    // component unmounted.
    let isCurrent = true;
    generatePollInsights(pollId, locale)
      .then((result) => {
        if (!isCurrent) return;
        setState(result.ok ? { status: "done", text: result.text } : { status: "error" });
      })
      .catch(() => {
        if (isCurrent) setState({ status: "error" });
      });
    return () => {
      isCurrent = false;
    };
  }, [pollId, locale, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((count) => count + 1);
  };

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

      <div aria-live="polite" aria-busy={state.status === "loading"} className="relative">
        {state.status === "loading" && (
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
        )}

        {state.status === "done" && (
          <p
            data-testid="ai-insights-summary"
            className="text-[15px] leading-relaxed text-slate-700 transition-opacity duration-500 starting:opacity-0 dark:text-slate-300"
          >
            {state.text}
          </p>
        )}

        {state.status === "error" && (
          <div
            data-testid="ai-insights-error"
            className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              {t("error")}
            </p>
            <button
              type="button"
              onClick={retry}
              data-testid="ai-insights-retry"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-700 ring-1 ring-primary-600/20 transition-colors duration-200 ring-inset hover:bg-primary-50 dark:text-primary-300 dark:ring-primary-400/30 dark:hover:bg-primary-500/10"
            >
              <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
              {t("retry")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
