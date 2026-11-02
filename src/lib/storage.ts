import { Poll, Question, UserRole, Vote } from "@/types";
import { initialPolls, initialQuestions, initialVotes } from "@/lib/mockData";

const STATE_STORAGE_KEY = "pollhub_state_v2";
const ROLE_STORAGE_KEY = "pollhub_role_v1";

export interface PersistedState {
  polls: Poll[];
  questions: Question[];
  votes: Vote[];
}

const DEFAULT_STATE: PersistedState = {
  polls: initialPolls,
  questions: initialQuestions,
  votes: initialVotes,
};

export function loadState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const { polls, questions, votes } = JSON.parse(raw) as Partial<PersistedState>;
    if (!polls || !questions || !votes) return DEFAULT_STATE;
    return { polls, questions, votes };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: PersistedState) {
  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
}

export function loadRole(): UserRole {
  return window.localStorage.getItem(ROLE_STORAGE_KEY) === "Manager"
    ? "Manager"
    : "Participant";
}

export function saveRole(role: UserRole) {
  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}
