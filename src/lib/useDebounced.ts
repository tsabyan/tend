"use client";

import { useEffect, useRef } from "react";

// Debounce a side-effect (e.g. persisting text edits) without losing the last call.
export function useDebounced<A extends unknown[]>(fn: (...args: A) => void, ms = 600) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), ms);
  };
}
