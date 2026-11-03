/**
 * Data transfer objects passed from the server to the UI. Dates travel as
 * Unix timestamps in milliseconds so they serialize across the
 * Server → Client Component boundary.
 */

export type UserRole = "MANAGER" | "PARTICIPANT";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Option {
  id: string;
  text: string;
}

/** A poll is open or closed depending only on `closesAt`; see lib/closingTime. */
export interface Poll {
  id: string;
  title: string;
  /** Closing time as a Unix timestamp in milliseconds. */
  closesAt: number;
}

export interface Question {
  id: string;
  pollId: string;
  text: string;
  options: Option[];
}

export interface PollResult {
  option: Option;
  count: number;
}

/** One row of the poll list. */
export interface PollSummary {
  poll: Poll;
  optionCount: number;
  totalVotes: number;
  /** Whether the signed-in user has voted on this poll. */
  hasVoted: boolean;
}

/** Everything the poll page shows. */
export interface PollDetail {
  poll: Poll;
  question: Question;
  results: PollResult[];
  totalVotes: number;
  hasVoted: boolean;
}

export interface NewPoll {
  title: string;
  questionText: string;
  optionTexts: string[];
  closesAt: number;
}
