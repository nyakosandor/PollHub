"use client";

import { createContext, ReactNode, useCallback, useContext, useSyncExternalStore } from "react";
import {
  MAX_TIMER_DELAY_MS,
  getTimeRemaining,
  isClosed,
  TimeUnit,
} from "@/lib/closingTime";

/**
 * Time-dependent UI (open/closed, countdowns) must render the same on the
 * server and during hydration, or React reports a mismatch. The server's
 * render time is passed down and used as the "server snapshot"; after
 * hydration the hooks below switch to the browser clock and keep it current.
 */
const ServerNowContext = createContext<number | null>(null);

export function ServerNowProvider({ now, children }: { now: number; children: ReactNode }) {
  return <ServerNowContext value={now}>{children}</ServerNowContext>;
}

function useServerNow() {
  const now = useContext(ServerNowContext);
  if (now === null) throw new Error("ServerNowProvider is missing");
  return now;
}

const noop = () => () => {};

/** Whether `closesAt` has passed; flips by itself at the closing time. */
export function useIsClosed(closesAt: number) {
  const serverNow = useServerNow();
  const subscribe = useCallback(
    (onChange: () => void) => {
      const delayMs = closesAt - Date.now() + 1;
      if (delayMs <= 0) return () => {};
      const timer = setTimeout(onChange, Math.min(delayMs, MAX_TIMER_DELAY_MS));
      return () => clearTimeout(timer);
    },
    [closesAt]
  );
  return useSyncExternalStore(
    subscribe,
    () => isClosed(closesAt, Date.now()),
    () => isClosed(closesAt, serverNow)
  );
}

/** Time left until `closesAt` in the largest fitting unit, refreshed periodically. */
export function useTimeRemaining(closesAt: number, refreshMs: number) {
  const serverNow = useServerNow();
  const subscribe = useCallback(
    (onChange: () => void) => {
      const interval = setInterval(onChange, refreshMs);
      return () => clearInterval(interval);
    },
    [refreshMs]
  );
  // Snapshots must be stable values, so the result travels as "unit:count".
  const toKey = (now: number) => {
    const { unit, count } = getTimeRemaining(closesAt, now);
    return `${unit}:${count}`;
  };
  const key = useSyncExternalStore(
    subscribe,
    () => toKey(Date.now()),
    () => toKey(serverNow)
  );
  const [unit, count] = key.split(":");
  return { unit: unit as TimeUnit, count: Number(count) };
}

/** False on the server and during hydration, true afterwards. */
export function useIsHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}
