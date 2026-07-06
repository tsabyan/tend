export type Goal = {
  id: string;
  title: string;
  focus_seconds: number;
  created_at: string;
};

export type Step = {
  id: string;
  goal_id: string;
  text: string;
  done: boolean;
  position: number;
  created_at: string;
};

export type Identity = {
  id: string;
  name: string;
  created_at: string;
};

export type Habit = {
  id: string;
  identity_id: string;
  name: string;
  schedule: number[];
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  day: string; // YYYY-MM-DD
};

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  today: boolean;
  created_at: string;
};
