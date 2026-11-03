import { PollResult } from "@/types";
import { toPercent } from "@/lib/format";
import { getLeaders, rankResults } from "@/lib/results";

const LOW_SAMPLE_SIZE = 5;

export type ConsensusStrength = "strong" | "clear" | "slight";

type InsightMessageKey =
  | "empty"
  | "quoted"
  | "tie"
  | "lead"
  | "runnerUp"
  | "unanimous"
  | "lowSample";

interface InsightLocale {
  /** Translates the `insights` namespace, e.g. useTranslations("insights"). */
  t: (key: InsightMessageKey, values?: Record<string, string | number>) => string;
  /** Joins items in the active locale, e.g. "A and B" or "A és B". */
  formatList: (items: string[]) => string;
}

function describeConsensus(marginPoints: number): ConsensusStrength {
  if (marginPoints >= 30) return "strong";
  if (marginPoints >= 15) return "clear";
  return "slight";
}

/**
 * Builds a simulated "AI" analysis in the active locale. It reads only
 * aggregated vote counts, never individual votes, as the spec requires of the
 * LLM summary.
 */
export function buildInsightSummary(
  results: PollResult[],
  totalVotes: number,
  { t, formatList }: InsightLocale
) {
  if (totalVotes === 0) return t("empty");

  const quote = (result: PollResult) => t("quoted", { text: result.option.text });
  const shareOf = (result: PollResult) => toPercent(result.count, totalVotes);
  const caveat = totalVotes < LOW_SAMPLE_SIZE ? [t("lowSample")] : [];

  const leaders = getLeaders(results);
  const leader = leaders[0];

  if (leaders.length > 1) {
    const tie = t("tie", {
      count: totalVotes,
      leaders: formatList(leaders.map(quote)),
      share: shareOf(leader),
    });
    return [tie, ...caveat].join(" ");
  }

  const runnerUp = rankResults(results)[1];
  const marginPoints = shareOf(leader) - (runnerUp ? shareOf(runnerUp) : 0);
  const lead = t("lead", {
    count: totalVotes,
    strength: describeConsensus(marginPoints),
    leader: quote(leader),
    share: shareOf(leader),
  });
  const distribution =
    runnerUp && runnerUp.count > 0
      ? t("runnerUp", {
          runnerUp: quote(runnerUp),
          share: shareOf(runnerUp),
          margin: marginPoints,
        })
      : t("unanimous");

  return [lead, distribution, ...caveat].join(" ");
}
