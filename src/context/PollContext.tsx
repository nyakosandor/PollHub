"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Poll, PollResult, UserRole, Vote } from "@/types";
import { MOCK_PARTICIPANT_ID, initialPolls, initialVotes } from "@/lib/mockData";
import { loadRole, loadState, saveRole, saveState } from "@/lib/storage";
import { createId } from "@/lib/ids";

interface PollContextValue {
  polls: Poll[];
  role: UserRole;
  isHydrated: boolean;
  setRole: (role: UserRole) => void;
  createPoll: (question: string, optionTexts: string[]) => void;
  closePoll: (pollId: string) => void;
  castVote: (pollId: string, optionId: string) => void;
  hasVoted: (pollId: string) => boolean;
  getPoll: (pollId: string) => Poll | undefined;
  getResults: (pollId: string) => PollResult[];
  getTotalVotes: (pollId: string) => number;
}

const PollContext = createContext<PollContextValue | undefined>(undefined);

export function PollProvider({ children }: { children: ReactNode }) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [role, setRole] = useState<UserRole>("Participant");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const state = loadState();
    // One-time client hydration from localStorage after SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPolls(state.polls);
    setVotes(state.votes);
    setRole(loadRole());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveState({ polls, votes });
  }, [polls, votes, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveRole(role);
  }, [role, isHydrated]);

  const getPoll = useCallback(
    (pollId: string) => polls.find((poll) => poll.id === pollId),
    [polls]
  );

  const hasVoted = useCallback(
    (pollId: string) =>
      votes.some(
        (vote) => vote.pollId === pollId && vote.userId === MOCK_PARTICIPANT_ID
      ),
    [votes]
  );

  const getTotalVotes = useCallback(
    (pollId: string) => votes.filter((vote) => vote.pollId === pollId).length,
    [votes]
  );

  const getResults = useCallback(
    (pollId: string): PollResult[] =>
      getPoll(pollId)?.options.map((option) => ({
        option,
        count: votes.filter(
          (vote) => vote.pollId === pollId && vote.optionId === option.id
        ).length,
      })) ?? [],
    [getPoll, votes]
  );

  const createPoll = useCallback((question: string, optionTexts: string[]) => {
    const newPoll: Poll = {
      id: createId("poll"),
      question,
      options: optionTexts.map((text) => ({ id: createId("opt"), text })),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setPolls((prev) => [newPoll, ...prev]);
  }, []);

  const closePoll = useCallback((pollId: string) => {
    setPolls((prev) =>
      prev.map((poll) =>
        poll.id === pollId ? { ...poll, status: "closed" } : poll
      )
    );
  }, []);

  const castVote = useCallback(
    (pollId: string, optionId: string) => {
      if (getPoll(pollId)?.status !== "open" || hasVoted(pollId)) return;
      setVotes((prev) => [
        ...prev,
        { id: createId("vote"), pollId, optionId, userId: MOCK_PARTICIPANT_ID },
      ]);
    },
    [getPoll, hasVoted]
  );

  const value = useMemo<PollContextValue>(
    () => ({
      polls,
      role,
      isHydrated,
      setRole,
      createPoll,
      closePoll,
      castVote,
      hasVoted,
      getPoll,
      getResults,
      getTotalVotes,
    }),
    [
      polls,
      role,
      isHydrated,
      createPoll,
      closePoll,
      castVote,
      hasVoted,
      getPoll,
      getResults,
      getTotalVotes,
    ]
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export function usePolls() {
  const ctx = useContext(PollContext);
  if (!ctx) throw new Error("usePolls must be used within a PollProvider");
  return ctx;
}
