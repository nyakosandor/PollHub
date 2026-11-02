import { PollResult } from "@/types";

/** Orders results by vote count, keeping the original order for equal counts. */
export function rankResults(results: PollResult[]) {
  return [...results].sort((a, b) => b.count - a.count);
}

/** The options with the most votes: several on a tie, none without any votes. */
export function getLeaders(results: PollResult[]) {
  const topCount = Math.max(0, ...results.map(({ count }) => count));
  return results.filter(({ count }) => count > 0 && count === topCount);
}
