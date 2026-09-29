import { Poll, Vote } from "@/types";

export const MOCK_PARTICIPANT_ID = "participant-1";

export const initialPolls: Poll[] = [
  {
    id: "poll-1",
    question: "Which feature should we prioritize next quarter?",
    options: [
      { id: "poll-1-opt-1", text: "Dark mode" },
      { id: "poll-1-opt-2", text: "Mobile app" },
      { id: "poll-1-opt-3", text: "API integrations" },
      { id: "poll-1-opt-4", text: "Offline support" },
    ],
    status: "open",
    createdAt: new Date("2026-09-20T09:00:00Z").toISOString(),
  },
  {
    id: "poll-2",
    question: "How satisfied are you with our onboarding experience?",
    options: [
      { id: "poll-2-opt-1", text: "Very satisfied" },
      { id: "poll-2-opt-2", text: "Satisfied" },
      { id: "poll-2-opt-3", text: "Neutral" },
      { id: "poll-2-opt-4", text: "Unsatisfied" },
    ],
    status: "closed",
    createdAt: new Date("2026-09-10T09:00:00Z").toISOString(),
  },
];

export const initialVotes: Vote[] = [
  { id: "vote-1", pollId: "poll-2", optionId: "poll-2-opt-1", userId: "participant-2" },
  { id: "vote-2", pollId: "poll-2", optionId: "poll-2-opt-1", userId: "participant-3" },
  { id: "vote-3", pollId: "poll-2", optionId: "poll-2-opt-2", userId: "participant-4" },
  { id: "vote-4", pollId: "poll-2", optionId: "poll-2-opt-3", userId: "participant-5" },
];
