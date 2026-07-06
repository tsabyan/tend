import type { Habit } from "@/lib/types";

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const DOW_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export type LogSet = Set<string>; // set of "YYYY-MM-DD" per habit

export const isScheduled = (habit: Habit, date: Date) =>
  (habit.schedule ?? ALL_DAYS).includes(date.getDay());

export const schedLabel = (sched: number[] | null) => {
  const s = sched ?? ALL_DAYS;
  if (s.length === 7) return "Every day";
  if (s.length === 5 && [1, 2, 3, 4, 5].every((d) => s.includes(d))) return "Weekdays";
  return s.slice().sort().map((d) => DOW[d]).join(" ");
};

export function currentStreak(habit: Habit, log: LogSet, today: Date): number {
  const todayIso = toISO(today);
  let count = 0;
  const d = new Date(today);
  for (let i = 0; i < 730; i++) {
    if (isScheduled(habit, d)) {
      const iso = toISO(d);
      if (log.has(iso)) count++;
      else if (iso !== todayIso) break;
    }
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function longestStreak(habit: Habit, log: LogSet, today: Date): number {
  const d = startOfDay(new Date(habit.created_at || Date.now()));
  let max = 0;
  let run = 0;
  while (d <= today) {
    if (isScheduled(habit, d)) {
      if (log.has(toISO(d))) {
        run++;
        if (run > max) max = run;
      } else run = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return max;
}

export function rate30(habit: Habit, log: LogSet, today: Date): number {
  const d = new Date(today);
  d.setDate(d.getDate() - 29);
  let sched = 0;
  let done = 0;
  while (d <= today) {
    if (isScheduled(habit, d)) {
      sched++;
      if (log.has(toISO(d))) done++;
    }
    d.setDate(d.getDate() + 1);
  }
  return sched === 0 ? 0 : Math.round((done / sched) * 100);
}
