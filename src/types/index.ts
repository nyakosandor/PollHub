export type UserRole = "Participant" | "Manager";

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

export interface Vote {
  id: string;
  pollId: string;
  questionId: string;
  optionId: string;
  userId: string;
}

export interface NewPoll {
  title: string;
  questionText: string;
  optionTexts: string[];
  closesAt: number;
}

export interface PollResult {
  option: Option;
  count: number;
}
