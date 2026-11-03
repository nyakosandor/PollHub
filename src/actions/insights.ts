"use server";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCurrentUser, getPollDetail } from "@/lib/dal";
import { summarizePollResults } from "@/lib/gemini";
import { buildInsightSummary } from "@/lib/insights";
import { PollResult } from "@/types";

export type InsightsResult =
  | { ok: true; text: string }
  | { ok: false; error: "forbidden" | "notFound" | "generationFailed" };

/**
 * "mock" makes the action return the rule-based summary instead of calling
 * Gemini. The E2E tests use it, so they don't spend API quota and get the
 * same text on every run.
 */
const isMockMode = () => process.env.AI_INSIGHTS_MODE === "mock";

// The same results always get the same summary, so reloads and other viewers
// don't repeat a paid request. The key changes with every new vote.
const MAX_CACHE_ENTRIES = 200;
const summaryCache = new Map<string, Promise<string>>();

function cachedSummary(key: string, generate: () => Promise<string>) {
  const cached = summaryCache.get(key);
  if (cached) return cached;
  const summary = generate();
  summaryCache.set(key, summary);
  if (summaryCache.size > MAX_CACHE_ENTRIES) {
    summaryCache.delete(summaryCache.keys().next().value!);
  }
  // A failure is not cached: the next request tries again.
  summary.catch(() => summaryCache.delete(key));
  return summary;
}

async function ruleBasedSummary(results: PollResult[], totalVotes: number, locale: string) {
  const t = await getTranslations({ locale: locale as "en" | "hu", namespace: "insights" });
  const listFormat = new Intl.ListFormat(locale, { type: "conjunction" });
  return buildInsightSummary(results, totalVotes, {
    t,
    formatList: (items) => listFormat.format(items),
  });
}

/**
 * Generates the AI summary of a poll's results. Only the poll id comes from
 * the browser: the question and the vote counts are read from the database,
 * so the action can't be used to send arbitrary prompts with our API key.
 */
export async function generatePollInsights(
  pollId: string,
  locale: string
): Promise<InsightsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };
  if (!hasLocale(routing.locales, locale)) return { ok: false, error: "notFound" };

  const detail = await getPollDetail(pollId, user.id);
  if (!detail) return { ok: false, error: "notFound" };
  const { question, results, totalVotes } = detail;

  // Nothing to analyze yet, and no reason to call the model.
  if (totalVotes === 0 || isMockMode()) {
    return { ok: true, text: await ruleBasedSummary(results, totalVotes, locale) };
  }

  const cacheKey = [locale, question.id, ...results.map(({ count }) => count)].join("|");
  try {
    const text = await cachedSummary(cacheKey, () =>
      summarizePollResults({ pollQuestion: question.text, aggregatedResults: results, locale })
    );
    return { ok: true, text };
  } catch (error) {
    // Logged on the server only; the browser just learns that it failed.
    console.error("Gemini insights failed:", error);
    return { ok: false, error: "generationFailed" };
  }
}
