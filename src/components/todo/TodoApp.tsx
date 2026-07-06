"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Check, Sun, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { chimeTodo } from "@/lib/chime";
import type { Todo } from "@/lib/types";

export default function TodoApp() {
  // createBrowserClient is a module-level singleton, so this is stable across renders
  const supabase = createClient();
  const [loaded, setLoaded] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [popId, setPopId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("todos")
        .select("id, text, done, today, created_at")
        .order("created_at", { ascending: false });
      if (data) setTodos(data);
      setLoaded(true);
    })();
  }, [supabase]);

  const add = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    inputRef.current?.focus();
    const { data, error } = await supabase
      .from("todos")
      .insert({ text: t })
      .select("id, text, done, today, created_at")
      .single();
    if (error || !data) {
      alert("Couldn’t save the task. Try again.");
      return;
    }
    setTodos((xs) => [data, ...xs]);
  };

  const toggle = (id: string) => {
    const target = todos.find((x) => x.id === id);
    if (!target) return;
    if (!target.done) {
      chimeTodo();
      setPopId(id);
      setTimeout(() => setPopId(null), 320);
    }
    setTodos((xs) => xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    supabase.from("todos").update({ done: !target.done }).eq("id", id).then();
  };

  const toggleToday = (id: string) => {
    const target = todos.find((x) => x.id === id);
    if (!target) return;
    setTodos((xs) => xs.map((x) => (x.id === id ? { ...x, today: !x.today } : x)));
    supabase.from("todos").update({ today: !target.today }).eq("id", id).then();
  };

  const remove = (id: string) => {
    setTodos((xs) => xs.filter((x) => x.id !== id));
    supabase.from("todos").delete().eq("id", id).then();
  };

  const clearDone = () => {
    const ids = todos.filter((x) => x.done).map((x) => x.id);
    setTodos((xs) => xs.filter((x) => !x.done));
    if (ids.length) supabase.from("todos").delete().in("id", ids).then();
  };

  if (!loaded)
    return (
      <div className="td-root"><div className="td-wrap"><p className="td-sub">Loading…</p></div></div>
    );

  const today = todos.filter((x) => !x.done && x.today);
  const later = todos.filter((x) => !x.done && !x.today);
  const done = todos.filter((x) => x.done);
  const activeCount = today.length + later.length;

  const Task = (x: Todo) => (
    <div key={x.id} className={"td-task" + (x.done ? " done" : "")}>
      <button
        className={"td-check" + (x.done ? " on" : "") + (popId === x.id ? " pop" : "")}
        onClick={() => toggle(x.id)}
        aria-label={x.done ? "Mark not done" : "Mark done"}
      >
        {x.done && <Check size={15} strokeWidth={3} />}
      </button>
      <span className="td-text">{x.text}</span>
      {!x.done && (
        <button
          className={"td-sun" + (x.today ? " on" : "")}
          onClick={() => toggleToday(x.id)}
          aria-label={x.today ? "Move to Later" : "Do it today"}
          title={x.today ? "Move to Later" : "Do it today"}
        >
          <Sun size={17} fill={x.today ? "currentColor" : "none"} />
        </button>
      )}
      <button className="td-del" onClick={() => remove(x.id)} aria-label="Delete"><X size={17} /></button>
    </div>
  );

  return (
    <div className="td-root">
      <div className="td-wrap">
        <div className="suite-head"><div><span className="td-eyebrow">Get it out of your head</span>
        <h1 className="td-h1" style={{ margin: "3px 0 0" }}>Tasks</h1></div></div>
        <p className="td-sub">Capture anything fast. Tap the sun for what you’ll do today.</p>

        <div className="td-capture">
          <input
            ref={inputRef}
            className="td-capture-input"
            placeholder="Add a task… (Enter to save)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="td-addbtn" onClick={add} aria-label="Add"><Plus size={20} /></button>
        </div>
        <div className="td-hint">{activeCount > 0 ? `${activeCount} active · ${today.length} today` : "empty — all clear"}</div>

        {activeCount === 0 && done.length === 0 && (
          <div className="suite-empty"><p className="td-empty">No tasks. Dump everything rattling around your head here — the small, the trivial, the easily forgotten. Free up your mind.</p></div>
        )}

        {today.length > 0 && (
          <>
            <div className="td-sectlabel today"><Sun size={13} /><span className="t">Today</span><span className="line" /></div>
            <div className="td-list">{today.map(Task)}</div>
          </>
        )}

        {later.length > 0 && (
          <>
            <div className="td-sectlabel"><span className="t">{today.length > 0 ? "Later" : "All tasks"}</span><span className="line" /></div>
            <div className="td-list">{later.map(Task)}</div>
          </>
        )}

        {done.length > 0 && (
          <>
            <div className="td-sectlabel">
              <span className="t">Done · {done.length}</span><span className="line" />
              <button className="td-clear" onClick={clearDone}><Trash2 size={13} /> Clear</button>
            </div>
            <div className="td-list">{done.map(Task)}</div>
          </>
        )}
      </div>
    </div>
  );
}
