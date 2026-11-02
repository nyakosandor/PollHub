import { PollResult } from "@/types";
import { formatList, pluralize, toPercent } from "@/lib/format";
import { getLeaders, rankResults } from "@/lib/results";

const LOW_SAMPLE_SIZE = 5;

function describeConsensus(marginPoints: number) {
  if (marginPoints >= 30) return "strongly favors";
  if (marginPoints >= 15) return "clearly favors";
  return "leans toward";
}

const quote = (result: PollResult) => `"${result.option.text}"`;

/**
 * Builds a simulated "AI" analysis. It reads only aggregated vote counts, never
 * individual votes, as the spec requires of the LLM summary.
 */
export function buildInsightSummary(results: PollResult[], totalVotes: number) {
  if (totalVotes === 0) {
    return "No responses have been aggregated yet, so there is nothing for the simulated analysis to summarize. Insights will appear once votes come in.";
  }

  const opening = `Based on the ${pluralize(totalVotes, "aggregated response")}, the simulated consensus`;
  const caveat =
    totalVotes < LOW_SAMPLE_SIZE
      ? " With so few responses, treat this as an early signal."
      : "";
  const shareOf = (result: PollResult) => toPercent(result.count, totalVotes);

  const leaders = getLeaders(results);
  const leader = leaders[0];

  if (leaders.length > 1) {
    return `${opening} is split evenly between ${formatList(leaders.map(quote))}, each with ${shareOf(leader)}% of the vote. The distribution suggests there is no clear favorite yet, so a few more responses could decide the outcome.${caveat}`;
  }

  const runnerUp = rankResults(results)[1];
  const marginPoints = shareOf(leader) - (runnerUp ? shareOf(runnerUp) : 0);
  const distribution =
    runnerUp && runnerUp.count > 0
      ? `The distribution suggests ${quote(runnerUp)} is the main alternative at ${shareOf(runnerUp)}%, ${pluralize(marginPoints, "percentage point")} behind.`
      : "The distribution suggests complete agreement, as no other option has received a vote.";

  return `${opening} ${describeConsensus(marginPoints)} ${quote(leader)} with ${shareOf(leader)}% of the vote. ${distribution}${caveat}`;
}
