import { pluralize } from "@/lib/format";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
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

/** Describes the time left until closing, e.g. "Closes in 2 days". */
export function formatTimeRemaining(closesAt: number, now: number) {
  const minutes = Math.max(Math.ceil((closesAt - now) / MINUTE_MS), 1);
  if (minutes < 60) return `Closes in ${pluralize(minutes, "minute")}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Closes in ${pluralize(hours, "hour")}`;

  return `Closes in ${pluralize(Math.round(hours / 24), "day")}`;
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
