export type PollStatus = "open" | "closed";

export type UserRole = "Participant" | "Manager";

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  status: PollStatus;
  createdAt: string;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
}

export interface PollResult {
  option: PollOption;
  count: number;
}
