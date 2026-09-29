import { Poll, PollResult } from "@/types";
import { pluralize, toPercent } from "@/lib/format";

function describePreferenceStrength(marginPoints: number) {
  if (marginPoints >= 30) return "an overwhelming preference";
  if (marginPoints >= 15) return "a clear preference";
  return "a slight but notable lean";
}

/** Builds a fictitious "AI" summary from the aggregated poll results. */
export function buildInsightSummary(
  poll: Poll,
  results: PollResult[],
  totalVotes: number
) {
  if (totalVotes === 0) {
    return `No responses have been collected for "${poll.question}" yet. Once votes start coming in, this summary will highlight the leading option and any notable trends in the fictitious aggregated data.`;
  }

  const [leader, runnerUp] = [...results].sort((a, b) => b.count - a.count);
  const leaderShare = toPercent(leader.count, totalVotes);
  const runnerUpShare = runnerUp ? toPercent(runnerUp.count, totalVotes) : 0;
  const strength = describePreferenceStrength(leaderShare - runnerUpShare);

  const runnerUpSentence = runnerUp
    ? `"${runnerUp.option.text}" trails as the second most popular choice, suggesting it could serve as a strong alternative if priorities shift. `
    : "";

  return `Based on the aggregated fictitious data from ${pluralize(totalVotes, "response")}, respondents show ${strength} toward "${leader.option.text}," which captured roughly ${leaderShare}% of all votes. ${runnerUpSentence}Overall, the results indicate a fairly decisive signal from participants, making "${leader.option.text}" the standout choice for "${poll.question}".`;
}
