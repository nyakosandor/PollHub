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
import { NewPoll, Poll, PollResult, Question, UserRole, Vote } from "@/types";
import {
  MOCK_PARTICIPANT_ID,
  initialPolls,
  initialQuestions,
  initialVotes,
} from "@/lib/mockData";
import { loadRole, loadState, saveRole, saveState } from "@/lib/storage";
import { createId } from "@/lib/ids";
import {
  MAX_TIMER_DELAY_MS,
  isClosed,
  nextClosingTime,
} from "@/lib/closingTime";

interface PollContextValue {
  polls: Poll[];
  role: UserRole;
  isHydrated: boolean;
  setRole: (role: UserRole) => void;
  createPoll: (newPoll: NewPoll) => void;
  closePoll: (pollId: string) => void;
  castVote: (questionId: string, optionId: string) => void;
  hasVoted: (pollId: string) => boolean;
  isPollClosed: (poll: Poll) => boolean;
  getPoll: (pollId: string) => Poll | undefined;
  getPollQuestion: (pollId: string) => Question | undefined;
  getResults: (questionId: string) => PollResult[];
  getTotalVotes: (questionId: string) => number;
}

const PollContext = createContext<PollContextValue | undefined>(undefined);

export function PollProvider({ children }: { children: ReactNode }) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [role, setRole] = useState<UserRole>("Participant");
  const [isHydrated, setIsHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const state = loadState();
    // One-time client hydration from localStorage after SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPolls(state.polls);
    setQuestions(state.questions);
    setVotes(state.votes);
    setRole(loadRole());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveState({ polls, questions, votes });
  }, [polls, questions, votes, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveRole(role);
  }, [role, isHydrated]);

  // Advance the clock just after the next poll closes, so open views update
  // without a reload. Re-runs after every tick to schedule the following one.
  useEffect(() => {
    const closesAt = nextClosingTime(
      polls.map((poll) => poll.closesAt),
      now
    );
    if (closesAt === undefined) return;

    const delayMs = Math.max(closesAt - Date.now() + 1, 0);
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(delayMs, MAX_TIMER_DELAY_MS)
    );
    return () => clearTimeout(timer);
  }, [polls, now]);

  const isPollClosed = useCallback(
    (poll: Poll) => isClosed(poll.closesAt, now),
    [now]
  );

  const getPoll = useCallback(
    (pollId: string) => polls.find((poll) => poll.id === pollId),
    [polls]
  );

  // Each poll has exactly one question for now.
  const getPollQuestion = useCallback(
    (pollId: string) =>
      questions.find((question) => question.pollId === pollId),
    [questions]
  );

  const hasVoted = useCallback(
    (pollId: string) =>
      votes.some(
        (vote) => vote.pollId === pollId && vote.userId === MOCK_PARTICIPANT_ID
      ),
    [votes]
  );

  const getTotalVotes = useCallback(
    (questionId: string) =>
      votes.filter((vote) => vote.questionId === questionId).length,
    [votes]
  );

  const getResults = useCallback(
    (questionId: string): PollResult[] =>
      questions
        .find((question) => question.id === questionId)
        ?.options.map((option) => ({
          option,
          count: votes.filter(
            (vote) =>
              vote.questionId === questionId && vote.optionId === option.id
          ).length,
        })) ?? [],
    [questions, votes]
  );

  const createPoll = useCallback(
    ({ title, questionText, optionTexts, closesAt }: NewPoll) => {
      const pollId = createId("poll");
      const question: Question = {
        id: createId("question"),
        pollId,
        text: questionText,
        options: optionTexts.map((text) => ({ id: createId("opt"), text })),
      };
      setPolls((prev) => [{ id: pollId, title, closesAt }, ...prev]);
      setQuestions((prev) => [question, ...prev]);
    },
    []
  );

  const closePoll = useCallback((pollId: string) => {
    const closedAt = Date.now();
    setPolls((prev) =>
      prev.map((poll) =>
        poll.id === pollId
          ? { ...poll, closesAt: Math.min(poll.closesAt, closedAt) }
          : poll
      )
    );
  }, []);

  const castVote = useCallback(
    (questionId: string, optionId: string) => {
      const question = questions.find(({ id }) => id === questionId);
      const poll = question && getPoll(question.pollId);
      if (!poll || isClosed(poll.closesAt, Date.now()) || hasVoted(poll.id)) {
        return;
      }
      setVotes((prev) => [
        ...prev,
        {
          id: createId("vote"),
          pollId: poll.id,
          questionId,
          optionId,
          userId: MOCK_PARTICIPANT_ID,
        },
      ]);
    },
    [questions, getPoll, hasVoted]
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
      isPollClosed,
      getPoll,
      getPollQuestion,
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
      isPollClosed,
      getPoll,
      getPollQuestion,
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
