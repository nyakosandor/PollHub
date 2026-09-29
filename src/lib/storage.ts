import { Poll, UserRole, Vote } from "@/types";
import { initialPolls, initialVotes } from "@/lib/mockData";

const STATE_STORAGE_KEY = "pollhub_state_v1";
const ROLE_STORAGE_KEY = "pollhub_role_v1";

export interface PersistedState {
  polls: Poll[];
  votes: Vote[];
}

const DEFAULT_STATE: PersistedState = { polls: initialPolls, votes: initialVotes };

export function loadState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.polls || !parsed.votes) return DEFAULT_STATE;
    return { polls: parsed.polls, votes: parsed.votes };
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
