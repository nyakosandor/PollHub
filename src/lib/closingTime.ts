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

export type TimeUnit = "minute" | "hour" | "day";

/**
 * The time left until closing in the largest fitting unit, e.g. 2 days. The
 * caller turns it into localized text such as "Closes in 2 days".
 */
export function getTimeRemaining(
  closesAt: number,
  now: number
): { unit: TimeUnit; count: number } {
  const minutes = Math.max(Math.ceil((closesAt - now) / MINUTE_MS), 1);
  if (minutes < 60) return { unit: "minute", count: minutes };

  const hours = Math.round(minutes / 60);
  if (hours < 24) return { unit: "hour", count: hours };

  return { unit: "day", count: Math.round(hours / 24) };
}

/** Formats a timestamp as the local-time value of a datetime-local input. */
export function toDateTimeInputValue(timestamp: number) {
  const offsetMs = new Date(timestamp).getTimezoneOffset() * 60 * 1000;
  return new Date(timestamp - offsetMs).toISOString().slice(0, 16);
}

/** Uses the browser's time zone, so only call it on the client. */
export function formatClosingTime(closesAt: number, locale: string) {
  return new Date(closesAt).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
