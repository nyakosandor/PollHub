import { useCallback, useEffect, useRef } from "react";

/** Schedules a single callback and clears it automatically on unmount. */
export function useTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const schedule = useCallback(
    (callback: () => void, delayMs: number) => {
      clear();
      timerRef.current = setTimeout(callback, delayMs);
    },
    [clear]
  );

  useEffect(() => clear, [clear]);

  return schedule;
}
