import { Poll, Question, Vote } from "@/types";

export const MOCK_PARTICIPANT_ID = "participant-1";

// Closing times are fixed, not relative to now, so that the server and the
// client render the same seed data.
export const initialPolls: Poll[] = [
  {
    id: "poll-1",
    title: "Next quarter priorities",
    closesAt: Date.UTC(2030, 0, 1),
  },
  {
    id: "poll-2",
    title: "Onboarding feedback",
    closesAt: Date.UTC(2026, 8, 17),
  },
];

export const initialQuestions: Question[] = [
  {
    id: "poll-1-q-1",
    pollId: "poll-1",
    text: "Which feature should we prioritize next quarter?",
    options: [
      { id: "poll-1-opt-1", text: "Dark mode" },
      { id: "poll-1-opt-2", text: "Mobile app" },
      { id: "poll-1-opt-3", text: "API integrations" },
      { id: "poll-1-opt-4", text: "Offline support" },
    ],
  },
  {
    id: "poll-2-q-1",
    pollId: "poll-2",
    text: "How satisfied are you with our onboarding experience?",
    options: [
      { id: "poll-2-opt-1", text: "Very satisfied" },
      { id: "poll-2-opt-2", text: "Satisfied" },
      { id: "poll-2-opt-3", text: "Neutral" },
      { id: "poll-2-opt-4", text: "Unsatisfied" },
    ],
  },
];

const seedVote = (id: string, optionId: string, userId: string): Vote => ({
  id,
  pollId: "poll-2",
  questionId: "poll-2-q-1",
  optionId,
  userId,
});

export const initialVotes: Vote[] = [
  seedVote("vote-1", "poll-2-opt-1", "participant-2"),
  seedVote("vote-2", "poll-2-opt-1", "participant-3"),
  seedVote("vote-3", "poll-2-opt-2", "participant-4"),
  seedVote("vote-4", "poll-2-opt-3", "participant-5"),
];
