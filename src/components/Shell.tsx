"use client";

import { useState } from "react";
import { Target, Flame, ListChecks, User } from "lucide-react";
import FocusApp from "@/components/focus/FocusApp";
import HabitApp from "@/components/habits/HabitApp";
import TodoApp from "@/components/todo/TodoApp";
import ProfileApp from "@/components/profile/ProfileApp";
import ConfirmProvider from "@/components/ui/ConfirmProvider";

export default function Shell() {
  const [tab, setTab] = useState<"focus" | "habit" | "todo" | "profile">("focus");
  const [focusImmersive, setFocusImmersive] = useState(false);

  return (
    <ConfirmProvider>
    <div className="suite-root">
      <div style={{ display: tab === "focus" ? "block" : "none" }}>
        <FocusApp active={tab === "focus"} onImmersive={setFocusImmersive} />
      </div>
      <div style={{ display: tab === "habit" ? "block" : "none" }}><HabitApp /></div>
      <div style={{ display: tab === "todo" ? "block" : "none" }}><TodoApp /></div>
      <div style={{ display: tab === "profile" ? "block" : "none" }}><ProfileApp /></div>
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
            <button className={"suite-tab" + (tab === "profile" ? " on" : "")} onClick={() => setTab("profile")}>
              <User size={20} /><span>Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
    </ConfirmProvider>
  );
}
