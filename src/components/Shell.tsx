"use client";

import { useState } from "react";
import { Target, Flame, ListChecks, LogOut } from "lucide-react";
import FocusApp from "@/components/focus/FocusApp";
import HabitApp from "@/components/habits/HabitApp";
import TodoApp from "@/components/todo/TodoApp";

export default function Shell() {
  const [tab, setTab] = useState<"focus" | "habit" | "todo">("focus");
  const [focusImmersive, setFocusImmersive] = useState(false);

  return (
    <div className="suite-root">
      {!focusImmersive && (
        <form action="/auth/signout" method="post">
          <button className="suite-signout" type="submit" aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </form>
      )}
      <div style={{ display: tab === "focus" ? "block" : "none" }}>
        <FocusApp active={tab === "focus"} onImmersive={setFocusImmersive} />
      </div>
      <div style={{ display: tab === "habit" ? "block" : "none" }}><HabitApp /></div>
      <div style={{ display: tab === "todo" ? "block" : "none" }}><TodoApp /></div>
      {!focusImmersive && (
        <nav className="suite-nav">
          <div className="suite-nav-inner">
            <button className={"suite-tab" + (tab === "focus" ? " on" : "")} onClick={() => setTab("focus")}>
              <Target size={20} /><span>Focus</span>
            </button>
            <button className={"suite-tab" + (tab === "habit" ? " on" : "")} onClick={() => setTab("habit")}>
              <Flame size={20} /><span>Habits</span>
            </button>
            <button className={"suite-tab" + (tab === "todo" ? " on" : "")} onClick={() => setTab("todo")}>
              <ListChecks size={20} /><span>Tasks</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
