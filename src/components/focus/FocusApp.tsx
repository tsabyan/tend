"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Check, ArrowRight, ArrowLeft, Sparkles, RotateCcw, Trash2, Play, Pause, Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { chimeSession } from "@/lib/chime";
import { useDebounced } from "@/lib/useDebounced";
import type { Goal, Step } from "@/lib/types";

const PRESETS = [15, 25, 50];

type Props = {
  active: boolean;
  onImmersive: (v: boolean) => void;
};

export default function FocusApp({ active, onImmersive }: Props) {
  // createBrowserClient is a module-level singleton, so this is stable across renders
  const supabase = createClient();
  const confirm = useConfirm();
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"home" | "plan" | "focus">("home");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState("");
  const [newStep, setNewStep] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  // hide navbar while in immersive focus view
  useEffect(() => {
    onImmersive(active && view === "focus");
  }, [active, view, onImmersive]);

  // pomodoro timer
  const [duration, setDuration] = useState(25); // minutes (work)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionFocus, setSessionFocus] = useState(0); // focus seconds not yet saved to goal

  const fmt = (s: number) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const fmtTotal = (s: number) => {
    const m = Math.round(s / 60);
    if (m < 60) return m + "m";
    return Math.floor(m / 60) + "h " + (m % 60) + "m";
  };

  // flush accumulated focus seconds into the selected goal
  const flushFocus = (extra = 0) => {
    const add = sessionFocus + extra;
    if (add > 0 && selectedId) {
      const g = goals.find((x) => x.id === selectedId);
      const total = (g?.focus_seconds ?? 0) + add;
      setSessionFocus(0);
      setGoals((gs) => gs.map((x) => (x.id === selectedId ? { ...x, focus_seconds: total } : x)));
      supabase.from("goals").update({ focus_seconds: total }).eq("id", selectedId).then();
    }
  };

  // ticking — one timeout per second so the callback always sees fresh state
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setRunning(false);
        flushFocus(mode === "work" ? 1 : 0);
        chimeSession();
        setSessionDone(true);
      } else {
        if (mode === "work") setSessionFocus((f) => f + 1);
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft, mode]);

  const startTimer = () => { setSessionDone(false); setRunning(true); };
  const pauseTimer = () => { setRunning(false); flushFocus(); };
  const resetTimer = () => {
    setRunning(false); flushFocus(); setSessionDone(false); setMode("work"); setSecondsLeft(duration * 60);
  };
  const pickDuration = (m: number) => { setDuration(m); setMode("work"); setRunning(false); setSessionDone(false); setSecondsLeft(m * 60); };
  const startBreak = () => { setMode("break"); setSessionDone(false); setSecondsLeft(5 * 60); setRunning(true); };
  const skipBreak = () => { setMode("work"); setSessionDone(false); setSecondsLeft(duration * 60); };

  // load
  useEffect(() => {
    (async () => {
      const [goalRes, stepRes] = await Promise.all([
        supabase.from("goals").select("id, title, focus_seconds, created_at").order("created_at", { ascending: false }),
        supabase.from("steps").select("id, goal_id, text, done, position, created_at").order("position"),
      ]);
      if (goalRes.data) setGoals(goalRes.data);
      if (stepRes.data) setSteps(stepRes.data);
      setLoaded(true);
    })();
  }, [supabase]);

  useEffect(() => {
    if (goalRef.current) {
      goalRef.current.style.height = "auto";
      goalRef.current.style.height = goalRef.current.scrollHeight + "px";
    }
  }, [view, selectedId, goals]);

  const goal = goals.find((g) => g.id === selectedId) || null;
  const goalSteps = goal ? steps.filter((s) => s.goal_id === goal.id) : [];

  const persistTitle = useDebounced((id: string, title: string) => {
    supabase.from("goals").update({ title }).eq("id", id).then();
  });
  const setTitle = (id: string, title: string) => {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, title } : g)));
    persistTitle(id, title);
  };

  const addGoal = async () => {
    const t = newGoal.trim();
    if (!t) return;
    setNewGoal("");
    const { data, error } = await supabase
      .from("goals").insert({ title: t }).select("id, title, focus_seconds, created_at").single();
    if (error || !data) { alert("Couldn’t save the goal. Try again."); return; }
    setGoals((gs) => [data, ...gs]);
    setSelectedId(data.id);
    setView("plan");
  };

  const deleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirm({ title: "Delete goal", message: "Delete this goal and its steps? This can’t be undone." }))) return;
    setGoals((gs) => gs.filter((g) => g.id !== id));
    setSteps((ss) => ss.filter((s) => s.goal_id !== id));
    supabase.from("goals").delete().eq("id", id).then();
  };

  const addStep = async (text: string) => {
    const t = text.trim();
    if (!t || !goal) return;
    setNewStep("");
    const position = goalSteps.length ? Math.max(...goalSteps.map((s) => s.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("steps").insert({ goal_id: goal.id, text: t, position })
      .select("id, goal_id, text, done, position, created_at").single();
    if (error || !data) { alert("Couldn’t save the step. Try again."); return; }
    setSteps((ss) => [...ss, data]);
  };

  const toggleStep = (sid: string) => {
    const s = steps.find((x) => x.id === sid);
    if (!s) return;
    setSteps((ss) => ss.map((x) => (x.id === sid ? { ...x, done: !x.done } : x)));
    supabase.from("steps").update({ done: !s.done }).eq("id", sid).then();
  };

  const deleteStep = (sid: string) => {
    setSteps((ss) => ss.filter((x) => x.id !== sid));
    supabase.from("steps").delete().eq("id", sid).then();
  };

  const openGoal = (id: string) => { setSelectedId(id); setView("plan"); };

  const suggestSteps = async () => {
    if (!goal || !goal.title.trim() || suggesting) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.title.trim() }),
      });
      if (!res.ok) throw new Error("request failed");
      const { steps: drafted } = (await res.json()) as { steps: string[] };
      if (!drafted?.length) throw new Error("empty");
      const base = goalSteps.length ? Math.max(...goalSteps.map((s) => s.position)) + 1 : 0;
      const rows = drafted.map((text, i) => ({ goal_id: goal.id, text, position: base + i }));
      const { data, error } = await supabase
        .from("steps").insert(rows).select("id, goal_id, text, done, position, created_at");
      if (error || !data) throw new Error("insert failed");
      setSteps((ss) => [...ss, ...data]);
    } catch {
      alert("Couldn’t draft steps. Try again, or add manually.");
    } finally {
      setSuggesting(false);
    }
  };

  if (!loaded) {
    return (<div className="naf-root"><div className="naf-wrap"><p className="naf-meta">Loading…</p></div></div>);
  }

  // ---------- FOCUS ----------
  if (view === "focus" && goal) {
    const list = goalSteps;
    const idx = list.findIndex((s) => !s.done);
    const current = idx === -1 ? null : list[idx];
    const doneCount = list.filter((s) => s.done).length;
    const completeCurrent = () => {
      if (!current) return;
      setFadingOut(true);
      setTimeout(() => { toggleStep(current.id); setFadingOut(false); }, 320);
    };
    return (
      <div className="naf-root">
        <div className="naf-focus">
          <div className="naf-focus-top">
            <span className="naf-focus-goal">{goal.title || "Untitled"}</span>
            <button className="naf-focus-back" onClick={() => { pauseTimer(); setView("plan"); }}><ArrowLeft size={15} /> Plan</button>
          </div>
          {current ? (
            <>
              <div className="naf-focus-center">
                <div className="naf-focus-count">{String(doneCount + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}</div>
                <div className={"naf-focus-action" + (fadingOut ? " naf-fade-out" : "")}>{current.text}</div>
              </div>
              <div className="naf-focus-bottom">
                <div className="naf-timer">
                  <div className={"naf-time" + (mode === "break" ? " break" : "") + (secondsLeft === 0 ? " zero" : "")}>{fmt(secondsLeft)}</div>
                  {sessionDone ? (
                    <div className="naf-banner">
                      {mode === "work" ? (
                        <>Session done. Break?
                          <button className="naf-btn" onClick={startBreak}><Coffee size={14} /> Break 5m</button>
                          <button className="naf-btn" onClick={skipBreak}>Skip</button>
                        </>
                      ) : (
                        <>Break over.
                          <button className="naf-btn" onClick={skipBreak}>Start focus again</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="naf-timer-ctrl">
                        <button className={"naf-tbtn" + (running ? "" : " play")} onClick={running ? pauseTimer : startTimer} aria-label={running ? "Pause" : "Start"}>
                          {running ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                        </button>
                        <button className="naf-tbtn" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={16} /></button>
                      </div>
                      {!running && mode === "work" && (
                        <div className="naf-presets">
                          {PRESETS.map((m) => (
                            <button key={m} className={"naf-chip" + (duration === m ? " on" : "")} onClick={() => pickDuration(m)}>{m}m</button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button className="naf-done-btn" onClick={completeCurrent}><Check size={19} /> Done</button>
                <div className="naf-progressbar"><div className="naf-progressfill" style={{ width: (doneCount / list.length) * 100 + "%" }} /></div>
                {(goal.focus_seconds > 0 || sessionFocus > 0) && (
                  <div className="naf-focus-total">Total focus: {fmtTotal(goal.focus_seconds + sessionFocus)}</div>
                )}
              </div>
            </>
          ) : (
            <div className="naf-clear">
              <div className="naf-clear-mark"></div>
              <div className="naf-clear-title">All done.</div>
              <div className="naf-clear-sub">{list.length > 0 ? "Every step is complete. Pick another goal when ready." : "No steps yet. Plan it first."}</div>
              <button className="naf-btn" onClick={() => { pauseTimer(); setView("home"); }}><ArrowLeft size={15} /> All goals</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- PLAN ----------
  if (view === "plan" && goal) {
    const list = goalSteps;
    const idx = list.findIndex((s) => !s.done);
    const current = idx === -1 ? null : list[idx];
    const doneCount = list.filter((s) => s.done).length;
    return (
      <div className="naf-root">
        <div className="naf-wrap">
          <button className="naf-back" onClick={() => setView("home")}><ArrowLeft size={15} /> All goals</button>
          <textarea ref={goalRef} className="naf-goal-input" placeholder="What’s your big goal?" value={goal.title} rows={1}
            onChange={(e) => setTitle(goal.id, e.target.value)} />
          <div className="naf-divider" />
          {list.length === 0 && (<div className="suite-empty"><p className="naf-empty">No steps yet. Break this goal into small concrete pieces — or let AI draft them, then edit freely.</p></div>)}
          <div className="naf-steps">
            {list.map((s, i) => (
              <div key={s.id} className={"naf-step" + (s.done ? " done" : "")}>
                <span className="naf-num">{String(i + 1).padStart(2, "0")}</span>
                <button className={"naf-check" + (s.done ? " on" : "")} onClick={() => toggleStep(s.id)} aria-label={s.done ? "Mark not done" : "Mark done"}>{s.done && <Check size={14} strokeWidth={3} />}</button>
                <span className="naf-step-text">{s.text}</span>
                <button className="naf-del" onClick={() => deleteStep(s.id)} aria-label="Delete step"><X size={16} /></button>
              </div>
            ))}
          </div>
          <div className="naf-add">
            <input className="naf-add-input" placeholder="Add a step…" value={newStep} onChange={(e) => setNewStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStep(newStep)} />
            <button className="naf-iconbtn" onClick={() => addStep(newStep)} aria-label="Add"><Plus size={20} /></button>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="naf-btn naf-suggest" onClick={suggestSteps} disabled={!goal.title.trim() || suggesting}>
              <Sparkles size={15} className={suggesting ? "naf-spin" : ""} />{suggesting ? "Drafting…" : "Suggest steps with AI"}
            </button>
          </div>
          <div className="naf-actions">
            <button className="naf-btn primary" disabled={idx === -1} onClick={() => setView("focus")}>{idx === -1 ? "No active step" : "Start focus"} <ArrowRight size={16} /></button>
          </div>
          {list.length > 0 && (<div className="naf-meta">{doneCount} of {list.length} done · next: {current ? current.text : "—"}</div>)}
        </div>
      </div>
    );
  }

  // ---------- HOME ----------
  const sorted = [...goals].sort((a, b) => {
    const stepsOf = (g: Goal) => steps.filter((s) => s.goal_id === g.id);
    const isDone = (g: Goal) => {
      const gs = stepsOf(g);
      return gs.length > 0 && gs.every((s) => s.done) ? 1 : 0;
    };
    return isDone(a) - isDone(b);
  });
  return (
    <div className="naf-root">
      <div className="naf-wrap">
        <div className="suite-head"><div><span className="naf-eyebrow">Hold everything · work on one</span>
        <h1 className="naf-h1" style={{ margin: "3px 0 0" }}>Your goals</h1></div></div>
        <p className="naf-sub">It all lives here. Pick one to enter focus — one step at a time.</p>

        <div className="naf-newgoal">
          <input className="naf-newgoal-input" placeholder="Add a new goal…" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoal()} />
          <button className="naf-iconbtn" onClick={addGoal} aria-label="Add goal"><Plus size={20} /></button>
        </div>

        {goals.length === 0 ? (
          <div className="suite-empty"><p className="naf-empty">No goals yet. Write one above — big or small — then break it into steps.</p></div>
        ) : (
          <div className="naf-goals">
            {sorted.map((g) => {
              const gs = steps.filter((s) => s.goal_id === g.id);
              const total = gs.length;
              const done = gs.filter((s) => s.done).length;
              const next = gs.find((s) => !s.done);
              const complete = total > 0 && done === total;
              return (
                <div key={g.id} className={"naf-card" + (complete ? " complete" : "")} onClick={() => openGoal(g.id)}>
                  <div className="naf-card-top">
                    <div className="naf-card-title">{g.title || "Untitled"}</div>
                    <div className="naf-card-topright">
                      {total > 0 && <div className="naf-card-count">{done}/{total}</div>}
                      <button className="naf-card-del" onClick={(e) => deleteGoal(g.id, e)} aria-label="Delete goal"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {total === 0 ? (
                    <div className="naf-card-next">No steps yet — tap to plan</div>
                  ) : complete ? (
                    <div className="naf-card-done"><Check size={15} /> Done</div>
                  ) : (
                    <div className="naf-card-next">Next: <b>{next!.text}</b></div>
                  )}
                  {total > 0 && !complete && (<div className="naf-card-bar"><div className="naf-card-fill" style={{ width: (done / total) * 100 + "%" }} /></div>)}
                  {g.focus_seconds > 0 && (<div className="naf-card-count" style={{ marginTop: 9 }}>Focus {fmtTotal(g.focus_seconds)}</div>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
