const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_POLL_DURATION_MS = 7 * DAY_MS;

/** Longest delay setTimeout supports; larger values fire immediately. */
export const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

export function isClosed(closesAt: number, now: number) {
  return now > closesAt;
}

export function defaultClosingTime(now: number) {
  return now + DEFAULT_POLL_DURATION_MS;
}

/** The earliest closing time that has not passed yet, if there is one. */
export function nextClosingTime(closingTimes: number[], now: number) {
  const upcoming = closingTimes.filter((closesAt) => !isClosed(closesAt, now));
  return upcoming.length > 0 ? Math.min(...upcoming) : undefined;
}

/** Formats a timestamp as the local-time value of a datetime-local input. */
export function toDateTimeInputValue(timestamp: number) {
  const offsetMs = new Date(timestamp).getTimezoneOffset() * 60 * 1000;
  return new Date(timestamp - offsetMs).toISOString().slice(0, 16);
}

/** Uses the browser's locale and time zone, so only call it on the client. */
export function formatClosingTime(closesAt: number) {
  return new Date(closesAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
