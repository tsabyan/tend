import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Check, ArrowRight, ArrowLeft, Sparkles, RotateCcw, Trash2, Play, Pause, Coffee, Flame, Sun, Target, ListChecks } from "lucide-react";
import * as Tone from "tone";

// ===== shared =====
const uid = () => Date.now() + Math.random();


const NAV_CSS = `
.suite-root{min-height:100vh; background:#FBFAF7;}
.suite-nav{position:fixed; left:0; right:0; bottom:0; height:64px; background:rgba(251,250,247,0.94); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); border-top:1px solid #ededea; display:flex; justify-content:center; z-index:50;}
.suite-nav-inner{max-width:520px; width:100%; display:flex;}
.suite-tab{flex:1; background:none; border:none; color:#b3b6af; font-family:'Hanken Grotesk',system-ui,sans-serif; font-size:11px; font-weight:600; letter-spacing:.01em; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:pointer; transition:color .15s; padding-top:2px;}
.suite-tab span{line-height:1;}
.suite-tab.on{color:#E0913A;}
.suite-tab:hover{color:#1f2320;}
.suite-head{display:flex; align-items:center; gap:11px; margin-bottom:6px;}
.suite-head .naf-h1,.suite-head .hb-h1,.suite-head .td-h1{margin:2px 0 0;}
.suite-empty{text-align:center; padding:32px 6px 10px;}
.suite-empty .naf-empty,.suite-empty .hb-empty,.suite-empty .td-empty{margin-top:14px; padding:0;}
@media (prefers-reduced-motion: reduce){.suite-tab{transition:none;}}
`;

// ===== FOCUS =====

const FOCUS_KEY = "nextaction:state:v2";
const FOCUS_OLD_KEY = "nextaction:state";

const cssFocus = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');
.naf-root{ --ink:#1f2320; --ink2:#9a9e98; --amber:#E0913A; --amber-d:#c5772a; --card:#ffffff; --line:#ecebe4; --track:#f0eee7; min-height:100vh; background:transparent; color:var(--ink); font-family:'Hanken Grotesk',system-ui,sans-serif; -webkit-font-smoothing:antialiased;}
.naf-root *{box-sizing:border-box;}
.naf-wrap{max-width:520px; margin:0 auto; padding:34px 24px 100px;}
.naf-eyebrow{font-family:'Spline Sans Mono',monospace; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink2);}
.naf-h1{font-family:'Fraunces',serif; font-weight:500; font-size:28px; letter-spacing:-.01em; margin:8px 0 4px; color:var(--ink);}
.naf-sub{color:var(--ink2); font-size:14px; margin-bottom:28px;}
.naf-empty{color:var(--ink2); font-size:14px; padding:8px 0; line-height:1.6;}
.naf-newgoal{display:flex; gap:10px; margin-bottom:24px; align-items:center;}
.naf-newgoal-input{flex:1; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 15px; color:var(--ink); font-size:15px; outline:none; font-family:inherit;}
.naf-newgoal-input:focus{border-color:var(--amber);}
.naf-newgoal-input::placeholder{color:#bcbfb9;}
.naf-iconbtn{background:var(--amber); border:none; border-radius:12px; width:46px; height:46px; display:grid; place-items:center; color:#fff; cursor:pointer; flex-shrink:0; transition:background .15s;}
.naf-iconbtn:hover{background:var(--amber-d);}
.naf-goals{display:flex; flex-direction:column; gap:12px;}
.naf-card{background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px 20px; cursor:pointer; transition:border-color .15s; position:relative;}
.naf-card:hover{border-color:#dad8cf;}
.naf-card.complete{opacity:.6;}
.naf-card-top{display:flex; justify-content:space-between; align-items:flex-start; gap:12px;}
.naf-card-title{font-family:'Fraunces',serif; font-weight:500; font-size:19px; line-height:1.25; letter-spacing:-.01em; word-break:break-word; color:var(--ink);}
.naf-card-count{font-family:'Spline Sans Mono',monospace; font-size:12px; color:var(--ink2); flex-shrink:0; padding-top:4px;}
.naf-card-next{font-size:14px; color:var(--ink2); margin-top:8px; line-height:1.4;}
.naf-card-next b{color:var(--ink); font-weight:600;}
.naf-card-bar{height:5px; background:var(--track); border-radius:3px; overflow:hidden; margin-top:14px;}
.naf-card-fill{height:100%; background:var(--amber); border-radius:3px; transition:width .4s;}
.naf-card-done{color:var(--amber-d); font-size:14px; margin-top:8px; display:flex; align-items:center; gap:7px;}
.naf-card-del{position:absolute; top:14px; right:14px; background:none; border:none; color:#cfcdc4; cursor:pointer; padding:4px; opacity:0; transition:opacity .15s;}
.naf-card:hover .naf-card-del{opacity:1;}
.naf-card-del:hover{color:var(--ink);}
.naf-back{background:none; border:none; color:var(--ink2); cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:13px; padding:4px 0; margin-bottom:16px;}
.naf-back:hover{color:var(--ink);}
.naf-goal-input{width:100%; background:transparent; border:none; outline:none; color:var(--ink); font-family:'Fraunces',serif; font-weight:500; font-size:28px; line-height:1.15; letter-spacing:-.01em; resize:none; overflow:hidden;}
.naf-goal-input::placeholder{color:#c4c2b9;}
.naf-divider{height:1px; background:var(--line); margin:24px 0;}
.naf-steps{display:flex; flex-direction:column; gap:8px;}
.naf-step{display:flex; align-items:flex-start; gap:13px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 15px; transition:border-color .15s, opacity .2s;}
.naf-step:hover{border-color:#dad8cf;}
.naf-step.done{opacity:.5;}
.naf-num{font-family:'Spline Sans Mono',monospace; font-size:12px; color:var(--ink2); padding-top:3px; min-width:22px;}
.naf-check{flex-shrink:0; width:20px; height:20px; border-radius:7px; border:1.5px solid #d6d4ca; background:transparent; cursor:pointer; display:grid; place-items:center; margin-top:1px; transition:all .15s; color:#fff;}
.naf-check.on{background:var(--amber); border-color:var(--amber);}
.naf-step-text{flex:1; font-size:15px; line-height:1.45; padding-top:1px; word-break:break-word; color:var(--ink);}
.naf-step.done .naf-step-text{text-decoration:line-through;}
.naf-del{background:none; border:none; color:#cfcdc4; cursor:pointer; padding:2px; opacity:0; transition:opacity .15s;}
.naf-step:hover .naf-del{opacity:1;}
.naf-del:hover{color:var(--ink);}
.naf-add{display:flex; gap:10px; align-items:center; margin-top:16px;}
.naf-add-input{flex:1; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 15px; color:var(--ink); font-size:15px; outline:none; font-family:inherit;}
.naf-add-input:focus{border-color:var(--amber);}
.naf-add-input::placeholder{color:#bcbfb9;}
.naf-actions{display:flex; gap:10px; margin-top:28px; flex-wrap:wrap;}
.naf-btn{font-family:inherit; font-size:14px; font-weight:600; border-radius:12px; padding:13px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line); background:var(--card); color:var(--ink); transition:all .15s;}
.naf-btn:hover{border-color:#dad8cf;}
.naf-btn.primary{background:var(--amber); color:#fff; border-color:var(--amber); flex:1; justify-content:center;}
.naf-btn.primary:hover{background:var(--amber-d); border-color:var(--amber-d);}
.naf-btn.primary:disabled{opacity:.4; cursor:not-allowed;}
.naf-suggest{color:var(--amber-d); border-color:#eaddc6; background:#fbf3e6;}
.naf-meta{font-family:'Spline Sans Mono',monospace; font-size:11px; color:var(--ink2); margin-top:20px; letter-spacing:.04em;}
.naf-focus{min-height:100vh; display:flex; flex-direction:column;}
.naf-focus-top{padding:28px 24px 0; display:flex; align-items:center; justify-content:space-between;}
.naf-focus-goal{font-size:13px; color:var(--ink2); max-width:62%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.naf-focus-back{background:none; border:none; color:var(--ink2); cursor:pointer; display:flex; align-items:center; gap:5px; font-family:inherit; font-size:13px; padding:4px;}
.naf-focus-back:hover{color:var(--ink);}
.naf-focus-center{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 30px; text-align:center;}
.naf-focus-count{font-family:'Spline Sans Mono',monospace; font-size:13px; color:var(--amber-d); letter-spacing:.1em; margin-bottom:28px;}
.naf-focus-action{font-family:'Fraunces',serif; font-weight:500; font-size:clamp(30px,7vw,46px); line-height:1.14; letter-spacing:-.015em; max-width:18ch; color:var(--ink); transition:opacity .35s, transform .35s;}
.naf-fade-out{opacity:0; transform:translateY(-10px);}
.naf-focus-bottom{padding:0 30px 50px; display:flex; flex-direction:column; align-items:center; gap:18px;}
.naf-done-btn{background:var(--amber); color:#fff; border:none; border-radius:40px; padding:15px 40px; font-family:inherit; font-size:16px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:9px; transition:background .15s;}
.naf-done-btn:hover{background:var(--amber-d);}
.naf-progressbar{width:100%; max-width:260px; height:5px; background:var(--track); border-radius:3px; overflow:hidden;}
.naf-progressfill{height:100%; background:var(--amber); border-radius:3px; transition:width .4s ease;}
.naf-clear{text-align:center; padding:60px 30px;}
.naf-clear-mark{margin-bottom:20px; display:flex; justify-content:center;}
.naf-clear-title{font-family:'Fraunces',serif; font-size:27px; margin-bottom:8px; color:var(--ink);}
.naf-clear-sub{color:var(--ink2); font-size:15px; margin-bottom:30px;}
.naf-timer{display:flex; flex-direction:column; align-items:center; gap:14px; margin-bottom:6px;}
.naf-time{font-family:'Spline Sans Mono',monospace; font-size:38px; font-weight:500; letter-spacing:.02em; line-height:1; color:var(--ink); transition:color .2s;}
.naf-time.break{color:#5a8f7a;}
.naf-time.zero{color:var(--amber-d);}
.naf-timer-ctrl{display:flex; align-items:center; gap:10px;}
.naf-tbtn{width:42px; height:42px; border-radius:50%; border:1px solid var(--line); background:var(--card); color:var(--ink); display:grid; place-items:center; cursor:pointer; transition:border-color .15s;}
.naf-tbtn:hover{border-color:#dad8cf;}
.naf-tbtn.play{background:var(--amber); border-color:var(--amber); color:#fff;}
.naf-presets{display:flex; gap:7px;}
.naf-chip{font-family:'Spline Sans Mono',monospace; font-size:12px; padding:6px 13px; border-radius:20px; border:1px solid var(--line); background:var(--card); color:var(--ink2); cursor:pointer; transition:all .15s;}
.naf-chip:hover{color:var(--ink);}
.naf-chip.on{border-color:var(--amber); color:var(--amber-d); background:#fbf3e6;}
.naf-banner{font-size:13.5px; color:var(--amber-d); display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; text-align:center;}
.naf-banner .naf-btn{padding:8px 14px; font-size:13px;}
.naf-focus-total{font-family:'Spline Sans Mono',monospace; font-size:11px; color:var(--ink2); letter-spacing:.04em;}
.naf-spin{animation:nafspin 1s linear infinite;}
@keyframes nafspin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.naf-focus-action,.naf-done-btn,.naf-progressfill,.naf-card-fill{transition:none;} .naf-spin{animation:none;}}
`;


function FocusApp({ active, onImmersive }) {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("home"); // home | plan | focus
  const [goals, setGoals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newGoal, setNewGoal] = useState("");
  const [newStep, setNewStep] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const goalRef = useRef(null);

  // beri tahu shell agar navbar disembunyikan saat mode fokus immersive
  useEffect(() => {
    if (onImmersive) onImmersive(active && view === "focus");
  }, [active, view]);

  // pomodoro timer
  const PRESETS = [15, 25, 50];
  const [duration, setDuration] = useState(25); // minutes (work)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("work"); // work | break
  const [sessionDone, setSessionDone] = useState(false);
  const tickRef = useRef(null);
  const sessionFocusRef = useRef(0); // focus seconds not yet saved to goal

  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const fmtTotal = (s) => {
    const m = Math.round(s / 60);
    if (m < 60) return m + "m";
    return Math.floor(m / 60) + "h " + (m % 60) + "m";
  };

  const chime = async () => {
    try {
      await Tone.start();
      const synth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 } }).toDestination();
      synth.volume.value = -8;
      const now = Tone.now();
      synth.triggerAttackRelease("C5", "8n", now);
      synth.triggerAttackRelease("G5", "8n", now + 0.18);
    } catch (e) {}
  };

  // flush accumulated focus seconds into the selected goal
  const flushFocus = () => {
    if (sessionFocusRef.current > 0 && selectedId) {
      const add = sessionFocusRef.current;
      sessionFocusRef.current = 0;
      setGoals((gs) => gs.map((g) => (g.id === selectedId ? { ...g, focusSeconds: (g.focusSeconds || 0) + add } : g)));
    }
  };

  // ticking
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (mode === "work") sessionFocusRef.current += 1;
        if (s <= 1) {
          clearInterval(tickRef.current);
          setRunning(false);
          flushFocus();
          chime();
          setSessionDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode]);

  const startTimer = () => { setSessionDone(false); setRunning(true); };
  const pauseTimer = () => { setRunning(false); flushFocus(); };
  const resetTimer = () => {
    setRunning(false); flushFocus(); setSessionDone(false); setMode("work"); setSecondsLeft(duration * 60);
  };
  const pickDuration = (m) => { setDuration(m); setMode("work"); setRunning(false); setSessionDone(false); setSecondsLeft(m * 60); };
  const startBreak = () => { setMode("break"); setSessionDone(false); setSecondsLeft(5 * 60); setRunning(true); };
  const skipBreak = () => { setMode("work"); setSessionDone(false); setSecondsLeft(duration * 60); };

  // load (+ migrate old single-goal state)
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(FOCUS_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (Array.isArray(d.goals)) setGoals(d.goals);
        } else {
          try {
            const old = await window.storage.get(FOCUS_OLD_KEY);
            if (old && old.value) {
              const od = JSON.parse(old.value);
              if (od.goal || (od.steps && od.steps.length)) {
                setGoals([{ id: uid(), title: od.goal || "Tujuan", steps: od.steps || [], createdAt: Date.now() }]);
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // save
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(FOCUS_KEY, JSON.stringify({ goals })); }
      catch (e) { console.error("save failed", e); }
    })();
  }, [goals, loaded]);

  useEffect(() => {
    if (goalRef.current) {
      goalRef.current.style.height = "auto";
      goalRef.current.style.height = goalRef.current.scrollHeight + "px";
    }
  }, [view, selectedId]);

  const goal = goals.find((g) => g.id === selectedId) || null;

  const patchGoal = (id, patch) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const patchSteps = (id, fn) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, steps: fn(g.steps) } : g)));

  const addGoal = () => {
    const t = newGoal.trim();
    if (!t) return;
    const id = uid();
    setGoals((gs) => [{ id, title: t, steps: [], createdAt: Date.now() }, ...gs]);
    setNewGoal("");
    setSelectedId(id);
    setView("plan");
  };
  const deleteGoal = (id, e) => {
    e.stopPropagation();
    if (confirm("Delete this goal and its steps?")) setGoals((gs) => gs.filter((g) => g.id !== id));
  };

  const addStep = (text) => {
    const t = text.trim();
    if (!t || !goal) return;
    patchSteps(goal.id, (s) => [...s, { id: uid(), text: t, done: false }]);
    setNewStep("");
  };
  const toggleStep = (sid) => goal && patchSteps(goal.id, (s) => s.map((x) => (x.id === sid ? { ...x, done: !x.done } : x)));
  const deleteStep = (sid) => goal && patchSteps(goal.id, (s) => s.filter((x) => x.id !== sid));

  const openGoal = (id) => { setSelectedId(id); setView("plan"); };

  const suggestSteps = async () => {
    if (!goal || !goal.title.trim() || suggesting) return;
    setSuggesting(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content:
            "Break this goal into 4-7 small, concrete, immediately actionable steps, in order. " +
            'Reply ONLY with a JSON array of strings, no other text, no markdown. Goal: "' + goal.title.trim() + '"' }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("").replace(/```json|```/g, "").trim();
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        patchSteps(goal.id, (s) => [...s, ...arr.filter((x) => typeof x === "string" && x.trim()).map((x) => ({ id: uid(), text: x.trim(), done: false }))]);
      }
    } catch (e) {
      alert("Couldn\u2019t draft steps. Try again, or add manually.");
    } finally { setSuggesting(false); }
  };

  if (!loaded) {
    return (<div className="naf-root"><style>{cssFocus}</style><div className="naf-wrap"><p className="naf-meta">Loading…</p></div></div>);
  }

  // ---------- FOCUS ----------
  if (view === "focus" && goal) {
    const steps = goal.steps;
    const idx = steps.findIndex((s) => !s.done);
    const current = idx === -1 ? null : steps[idx];
    const doneCount = steps.filter((s) => s.done).length;
    const completeCurrent = () => {
      if (!current) return;
      setFadingOut(true);
      setTimeout(() => { toggleStep(current.id); setFadingOut(false); }, 320);
    };
    return (
      <div className="naf-root"><style>{cssFocus}</style>
        <div className="naf-focus">
          <div className="naf-focus-top">
            <span className="naf-focus-goal">{goal.title || "Tanpa judul"}</span>
            <button className="naf-focus-back" onClick={() => { pauseTimer(); setView("plan"); }}><ArrowLeft size={15} /> Plan</button>
          </div>
          {current ? (
            <>
              <div className="naf-focus-center">
                <div className="naf-focus-count">{String(doneCount + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</div>
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
                          <button className="naf-btn" onClick={skipBreak}>Start focus lagi</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="naf-timer-ctrl">
                        <button className={"naf-tbtn" + (running ? "" : " play")} onClick={running ? pauseTimer : startTimer} aria-label={running ? "Pause" : "Start"}>
                          {running ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                        </button>
                        <button className="naf-tbtn" onClick={resetTimer} aria-label="Atur ulang timer"><RotateCcw size={16} /></button>
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
                <div className="naf-progressbar"><div className="naf-progressfill" style={{ width: (doneCount / steps.length) * 100 + "%" }} /></div>
                {(goal.focusSeconds > 0 || sessionFocusRef.current > 0) && (
                  <div className="naf-focus-total">Total focus: {fmtTotal((goal.focusSeconds || 0) + sessionFocusRef.current)}</div>
                )}
              </div>
            </>
          ) : (
            <div className="naf-clear">
              <div className="naf-clear-mark"></div>
              <div className="naf-clear-title">All done.</div>
              <div className="naf-clear-sub">{steps.length > 0 ? "Every step is complete. Pick another goal when ready." : "No steps yet. Plan it first."}</div>
              <button className="naf-btn" onClick={() => { pauseTimer(); setView("home"); }}><ArrowLeft size={15} /> All goals</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- PLAN ----------
  if (view === "plan" && goal) {
    const steps = goal.steps;
    const idx = steps.findIndex((s) => !s.done);
    const current = idx === -1 ? null : steps[idx];
    const doneCount = steps.filter((s) => s.done).length;
    return (
      <div className="naf-root"><style>{cssFocus}</style>
        <div className="naf-wrap">
          <button className="naf-back" onClick={() => setView("home")}><ArrowLeft size={15} /> All goals</button>
          <textarea ref={goalRef} className="naf-goal-input" placeholder="What\u2019s your big goal?" value={goal.title} rows={1}
            onChange={(e) => patchGoal(goal.id, { title: e.target.value })} />
          <div className="naf-divider" />
          {steps.length === 0 && (<div className="suite-empty"><p className="naf-empty">No steps yet. Break this goal into small concrete pieces — or let AI draft them, then edit freely.</p></div>)}
          <div className="naf-steps">
            {steps.map((s, i) => (
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
          {steps.length > 0 && (<div className="naf-meta">{doneCount} of {steps.length} done · next: {current ? current.text : "—"}</div>)}
        </div>
      </div>
    );
  }

  // ---------- HOME (second brain) ----------
  const sorted = [...goals].sort((a, b) => {
    const ad = a.steps.length > 0 && a.steps.every((s) => s.done) ? 1 : 0;
    const bd = b.steps.length > 0 && b.steps.every((s) => s.done) ? 1 : 0;
    return ad - bd;
  });
  return (
    <div className="naf-root"><style>{cssFocus}</style>
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
              const total = g.steps.length;
              const done = g.steps.filter((s) => s.done).length;
              const next = g.steps.find((s) => !s.done);
              const complete = total > 0 && done === total;
              return (
                <div key={g.id} className={"naf-card" + (complete ? " complete" : "")} onClick={() => openGoal(g.id)}>
                  <button className="naf-card-del" onClick={(e) => deleteGoal(g.id, e)} aria-label="Delete goal"><Trash2 size={16} /></button>
                  <div className="naf-card-top">
                    <div className="naf-card-title">{g.title || "Tanpa judul"}</div>
                    {total > 0 && <div className="naf-card-count">{done}/{total}</div>}
                  </div>
                  {total === 0 ? (
                    <div className="naf-card-next">No steps yet — tap to plan</div>
                  ) : complete ? (
                    <div className="naf-card-done"><Check size={15} /> Done</div>
                  ) : (
                    <div className="naf-card-next">Next: <b>{next.text}</b></div>
                  )}
                  {total > 0 && !complete && (<div className="naf-card-bar"><div className="naf-card-fill" style={{ width: (done / total) * 100 + "%" }} /></div>)}
                  {g.focusSeconds > 0 && (<div className="naf-card-count" style={{ marginTop: 9 }}>Fokus {fmtTotal(g.focusSeconds)}</div>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== HABIT =====

const HABIT_KEY = "habits:state:v2";
const HABIT_OLD_KEY = "habits:state:v1";

const cssHabit = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');
.hb-root{ --ink:#1f2320; --ink2:#9a9e98; --amber:#E0913A; --amber-d:#c5772a; --card:#ffffff; --line:#ecebe4; --track:#f0eee7; min-height:100vh; background:transparent; color:var(--ink); font-family:'Hanken Grotesk',system-ui,sans-serif; -webkit-font-smoothing:antialiased;}
.hb-root *{box-sizing:border-box;}
.hb-wrap{max-width:520px; margin:0 auto; padding:34px 24px 100px;}
.hb-eyebrow{font-family:'Spline Sans Mono',monospace; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink2);}
.hb-h1{font-family:'Fraunces',serif; font-weight:500; font-size:28px; letter-spacing:-.01em; margin:8px 0 4px; color:var(--ink);}
.hb-sub{color:var(--ink2); font-size:14px; margin-bottom:24px;}
.hb-empty{color:var(--ink2); font-size:14px; padding:8px 0; line-height:1.6;}
.hb-tabs{display:flex; gap:4px; background:#f2f1ec; border-radius:12px; padding:4px; margin-bottom:26px;}
.hb-tab{flex:1; text-align:center; padding:10px; border-radius:9px; font-size:14px; font-weight:600; color:var(--ink2); cursor:pointer; border:none; background:transparent; font-family:inherit; transition:all .15s;}
.hb-tab.on{background:var(--amber); color:#fff;}
.hb-add{display:flex; gap:10px; margin-bottom:24px; align-items:center;}
.hb-add-input{flex:1; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 15px; color:var(--ink); font-size:15px; outline:none; font-family:inherit;}
.hb-add-input:focus{border-color:var(--amber);}
.hb-add-input::placeholder{color:#bcbfb9;}
.hb-iconbtn{background:var(--amber); border:none; border-radius:12px; width:46px; height:46px; display:grid; place-items:center; color:#fff; cursor:pointer; flex-shrink:0; transition:background .15s;}
.hb-iconbtn:hover{background:var(--amber-d);}
.hb-list{display:flex; flex-direction:column; gap:12px;}
.hb-idcard{background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px 20px; cursor:pointer; transition:border-color .15s;}
.hb-idcard:hover{border-color:#dad8cf;}
.hb-idcard-name{font-family:'Fraunces',serif; font-weight:500; font-size:20px; letter-spacing:-.01em; line-height:1.2; color:var(--ink);}
.hb-idcard-meta{font-family:'Spline Sans Mono',monospace; font-size:11px; color:var(--ink2); margin-top:7px; letter-spacing:.03em;}
.hb-idcard-bar{height:5px; background:var(--track); border-radius:3px; overflow:hidden; margin-top:14px;}
.hb-idcard-fill{height:100%; background:var(--amber); border-radius:3px; transition:width .4s;}
.hb-card{background:var(--card); border:1px solid var(--line); border-radius:18px; padding:16px 18px; transition:border-color .15s;}
.hb-card:hover{border-color:#dad8cf;}
.hb-card-head{display:flex; justify-content:space-between; align-items:center; gap:12px;}
.hb-card-left{flex:1; min-width:0; cursor:pointer;}
.hb-name{font-family:'Fraunces',serif; font-weight:500; font-size:18px; letter-spacing:-.01em; line-height:1.2; word-break:break-word; color:var(--ink);}
.hb-sched{font-family:'Spline Sans Mono',monospace; font-size:11px; color:var(--ink2); margin-top:4px; letter-spacing:.03em;}
.hb-streak{display:flex; align-items:center; gap:5px; color:var(--ink2); font-family:'Spline Sans Mono',monospace; font-size:13px; flex-shrink:0;}
.hb-streak.live{color:var(--amber-d);}
.hb-streak b{font-size:19px; font-weight:500;}
.hb-toggle{flex-shrink:0; width:46px; height:46px; border-radius:50%; border:1.5px solid #d6d4ca; background:transparent; color:#fff; display:grid; place-items:center; cursor:pointer; transition:all .18s;}
.hb-toggle:hover{border-color:#bcbab0;}
.hb-toggle.on{background:var(--amber); border-color:var(--amber);}
.hb-toggle.pop{animation:hbpop .3s ease;}
@keyframes hbpop{0%{transform:scale(.8);}50%{transform:scale(1.12);}100%{transform:scale(1);}}
.hb-strip{display:flex; gap:5px; margin-top:14px;}
.hb-cell{flex:1; aspect-ratio:1; max-width:18px; border-radius:5px; background:#f0eee7;}
.hb-cell.done{background:var(--amber);}
.hb-cell.missed{background:transparent; border:1px solid #dddbd1;}
.hb-cell.off{background:transparent; border:1px dashed #e6e4da;}
.hb-cell.today{outline:2px solid #f0d6ab; outline-offset:1px;}
.hb-grouplabel{display:flex; align-items:baseline; gap:8px; margin:24px 0 10px;}
.hb-grouplabel:first-child{margin-top:0;}
.hb-grouplabel .name{font-family:'Fraunces',serif; font-size:16px; font-weight:500; color:var(--ink);}
.hb-grouplabel .count{font-family:'Spline Sans Mono',monospace; font-size:11px; color:var(--ink2);}
.hb-row{display:flex; align-items:center; gap:13px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:13px 15px; margin-bottom:8px;}
.hb-row-name{flex:1; min-width:0; font-size:15px; font-weight:500; word-break:break-word; color:var(--ink);}
.hb-row.done .hb-row-name{color:var(--ink2);}
.hb-toggle.sm{width:38px; height:38px;}
.hb-summary{font-family:'Spline Sans Mono',monospace; font-size:12px; color:var(--ink2); margin-bottom:22px; letter-spacing:.03em;}
.hb-back{background:none; border:none; color:var(--ink2); cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:13px; padding:4px 0; margin-bottom:16px;}
.hb-back:hover{color:var(--ink);}
.hb-name-input{width:100%; background:transparent; border:none; outline:none; color:var(--ink); font-family:'Fraunces',serif; font-weight:500; font-size:27px; letter-spacing:-.01em;}
.hb-name-input::placeholder{color:#c4c2b9;}
.hb-divider{height:1px; background:var(--line); margin:24px 0;}
.hb-section-label{font-family:'Spline Sans Mono',monospace; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink2); margin-bottom:12px;}
.hb-days{display:flex; gap:7px; flex-wrap:wrap;}
.hb-daychip{font-family:'Spline Sans Mono',monospace; font-size:12px; padding:8px 11px; border-radius:9px; border:1px solid var(--line); background:var(--card); color:var(--ink2); cursor:pointer; transition:all .15s;}
.hb-daychip:hover{color:var(--ink);}
.hb-daychip.on{border-color:var(--amber); color:var(--amber-d); background:#fbf3e6;}
.hb-stats{display:flex; gap:10px;}
.hb-stat{flex:1; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px 14px; text-align:center;}
.hb-stat-num{font-family:'Spline Sans Mono',monospace; font-size:26px; font-weight:500; color:var(--ink);}
.hb-stat-num.amber{color:var(--amber-d);}
.hb-stat-label{font-size:11px; color:var(--ink2); margin-top:5px; letter-spacing:.02em;}
.hb-cal{display:grid; grid-template-columns:repeat(7,1fr); gap:6px;}
.hb-cal-head{font-family:'Spline Sans Mono',monospace; font-size:10px; color:var(--ink2); text-align:center; padding-bottom:4px;}
.hb-cal-cell{aspect-ratio:1; border-radius:9px; display:grid; place-items:center; font-family:'Spline Sans Mono',monospace; font-size:12px; background:#f4f3ee; color:#aeb1aa; cursor:pointer; transition:all .12s;}
.hb-cal-cell.done{background:var(--amber); color:#fff;}
.hb-cal-cell.missed{background:transparent; border:1px solid #dddbd1; color:var(--ink2);}
.hb-cal-cell.off{background:transparent; color:#cfcdc4; cursor:default;}
.hb-cal-cell.future{background:transparent; color:#cfcdc4; cursor:default;}
.hb-cal-cell.today{outline:2px solid var(--amber);}
.hb-cal-blank{aspect-ratio:1;}
.hb-btn{font-family:inherit; font-size:14px; font-weight:600; border-radius:12px; padding:12px 16px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line); background:var(--card); color:var(--ink); transition:border-color .15s;}
.hb-btn:hover{border-color:#dad8cf;}
.hb-btn.suggest{color:var(--amber-d); border-color:#eaddc6; background:#fbf3e6; width:100%; justify-content:center;}
.hb-btn.suggest:disabled{opacity:.5; cursor:not-allowed;}
.hb-btn.danger{color:#c0573a; border-color:#eecabd; background:#fbeee8;}
.hb-spin{animation:hbspin 1s linear infinite;}
@keyframes hbspin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.hb-toggle,.hb-idcard-fill,.hb-cal-cell{transition:none;} .hb-spin,.hb-toggle.pop{animation:none;}}
`;

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const TODAY = startOfDay(new Date());
const TODAY_ISO = toISO(TODAY);
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DOW_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const isScheduled = (habit, date) => (habit.schedule || ALL_DAYS).includes(date.getDay());
const schedLabel = (sched) => {
  const s = sched || ALL_DAYS;
  if (s.length === 7) return "Every day";
  if (s.length === 5 && [1, 2, 3, 4, 5].every((d) => s.includes(d))) return "Weekdays";
  return s.slice().sort().map((d) => DOW[d]).join(" ");
};

function currentStreak(habit) {
  let count = 0;
  const d = new Date(TODAY);
  for (let i = 0; i < 730; i++) {
    if (isScheduled(habit, d)) {
      const iso = toISO(d);
      if (habit.log[iso]) count++;
      else if (iso === TODAY_ISO) {} else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return count;
}
function longestStreak(habit) {
  const d = startOfDay(new Date(habit.createdAt || Date.now()));
  let max = 0, run = 0;
  while (d <= TODAY) {
    if (isScheduled(habit, d)) { if (habit.log[toISO(d)]) { run++; if (run > max) max = run; } else run = 0; }
    d.setDate(d.getDate() + 1);
  }
  return max;
}
function rate30(habit) {
  const d = new Date(TODAY); d.setDate(d.getDate() - 29);
  let sched = 0, done = 0;
  while (d <= TODAY) { if (isScheduled(habit, d)) { sched++; if (habit.log[toISO(d)]) done++; } d.setDate(d.getDate() + 1); }
  return sched === 0 ? 0 : Math.round((done / sched) * 100);
}

function HabitApp() {
  const [loaded, setLoaded] = useState(false);
  const [identities, setIdentities] = useState([]);
  const [tab, setTab] = useState("today"); // today | identities
  const [selIdn, setSelIdn] = useState(null);   // identity id (detail)
  const [selHabit, setSelHabit] = useState(null); // habit id (detail)
  const [newIdn, setNewIdn] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [generating, setGenerating] = useState(false);
  const [popId, setPopId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(HABIT_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (Array.isArray(d.identities)) setIdentities(d.identities);
        } else {
          try {
            const old = await window.storage.get(HABIT_OLD_KEY);
            if (old && old.value) {
              const od = JSON.parse(old.value);
              if (Array.isArray(od.habits) && od.habits.length) {
                setIdentities([{ id: uid(), name: "My habits", createdAt: Date.now(), habits: od.habits }]);
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(HABIT_KEY, JSON.stringify({ identities })); }
      catch (e) { console.error("save failed", e); }
    })();
  }, [identities, loaded]);

  const chime = async () => {
    try {
      await Tone.start();
      const s = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.25 } }).toDestination();
      s.volume.value = -10; s.triggerAttackRelease("E5", "16n");
    } catch (e) {}
  };

  const patchIdentity = (id, patch) => setIdentities((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const patchHabit = (idnId, habitId, fn) =>
    setIdentities((xs) => xs.map((x) => (x.id !== idnId ? x : { ...x, habits: x.habits.map((h) => (h.id === habitId ? fn(h) : h)) })));

  const addIdentity = () => {
    const n = newIdn.trim(); if (!n) return;
    setIdentities((xs) => [...xs, { id: uid(), name: n, createdAt: Date.now(), habits: [] }]);
    setNewIdn("");
  };
  const deleteIdentity = (id) => {
    if (confirm("Delete this identity and all its habits?")) { setIdentities((xs) => xs.filter((x) => x.id !== id)); setSelIdn(null); }
  };
  const addHabit = (idnId) => {
    const n = newHabit.trim(); if (!n) return;
    patchIdentity(idnId, { habits: [...(identities.find((x) => x.id === idnId)?.habits || []), { id: uid(), name: n, schedule: [...ALL_DAYS], log: {}, createdAt: Date.now() }] });
    setNewHabit("");
  };
  const deleteHabit = (idnId, habitId) => {
    if (confirm("Delete this habit?")) {
      setIdentities((xs) => xs.map((x) => (x.id !== idnId ? x : { ...x, habits: x.habits.filter((h) => h.id !== habitId) })));
      setSelHabit(null);
    }
  };

  const toggleDay = (idnId, habitId, iso, isToday) => {
    patchHabit(idnId, habitId, (h) => {
      const log = { ...h.log };
      if (log[iso]) delete log[iso];
      else { log[iso] = true; if (isToday) { chime(); setPopId(habitId); setTimeout(() => setPopId(null), 320); } }
      return { ...h, log };
    });
  };
  const toggleSchedDay = (idnId, habitId, day) => {
    patchHabit(idnId, habitId, (h) => {
      const has = h.schedule.includes(day);
      let s = has ? h.schedule.filter((d) => d !== day) : [...h.schedule, day];
      if (s.length === 0) s = [day];
      return { ...h, schedule: s };
    });
  };

  const generateHabits = async (idn) => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content:
            `For the identity/aspiration "${idn.name}", suggest 4-6 small, concrete, repeatable habits that genuinely embody that identity. ` +
            `Reply ONLY with a JSON array of objects {"name": string, "days": array of numbers 0-6 (0=Sunday, 1=Monday, etc)}. ` +
            `Use days [0,1,2,3,4,5,6] for daily habits or pick specific days. No other text, no markdown.` }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("").replace(/```json|```/g, "").trim();
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        const mapped = arr.filter((o) => o && typeof o.name === "string" && o.name.trim()).map((o) => {
          let days = Array.isArray(o.days) ? o.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
          if (days.length === 0) days = [...ALL_DAYS];
          return { id: uid(), name: o.name.trim(), schedule: days, log: {}, createdAt: Date.now() };
        });
        patchIdentity(idn.id, { habits: [...idn.habits, ...mapped] });
      }
    } catch (e) {
      alert("Couldn\u2019t draft habits. Try again, or add manually.");
    } finally { setGenerating(false); }
  };

  if (!loaded) return (<div className="hb-root"><style>{cssHabit}</style><div className="hb-wrap"><p className="hb-sub">Loading…</p></div></div>);

  const idn = identities.find((x) => x.id === selIdn) || null;
  const habitWrap = idn ? idn.habits.find((h) => h.id === selHabit) : null;

  // habit card (shared)
  const HabitCard = (h, idnId) => {
    const cur = currentStreak(h);
    const doneToday = !!h.log[TODAY_ISO];
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(TODAY); d.setDate(d.getDate() - i);
      const iso = toISO(d); const sched = isScheduled(h, d);
      let cls = "hb-cell";
      if (h.log[iso]) cls += " done"; else if (sched) cls += " missed"; else cls += " off";
      if (iso === TODAY_ISO) cls += " today";
      cells.push(<div key={iso} className={cls} />);
    }
    return (
      <div key={h.id} className="hb-card">
        <div className="hb-card-head">
          <div className="hb-card-left" onClick={() => { setSelHabit(h.id); }}>
            <div className="hb-name">{h.name}</div>
            <div className="hb-sched">{schedLabel(h.schedule)} · {cur > 0 ? `streak ${cur}` : "not started"}</div>
          </div>
          <div className={"hb-streak" + (cur > 0 ? " live" : "")}><Flame size={15} /><b>{cur}</b></div>
          <button className={"hb-toggle" + (doneToday ? " on" : "") + (popId === h.id ? " pop" : "")} onClick={() => toggleDay(idnId, h.id, TODAY_ISO, true)} aria-label={doneToday ? "Undo today" : "Mark today"}>
            {doneToday && <Check size={23} strokeWidth={3} />}
          </button>
        </div>
        <div className="hb-strip">{cells}</div>
      </div>
    );
  };

  // ---------- HABIT DETAIL ----------
  if (habitWrap && idn) {
    const h = habitWrap;
    const cur = currentStreak(h), longest = longestStreak(h), rate = rate30(h);
    const now = new Date(TODAY); const year = now.getFullYear(), month = now.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return (
      <div className="hb-root"><style>{cssHabit}</style>
        <div className="hb-wrap">
          <button className="hb-back" onClick={() => setSelHabit(null)}><ArrowLeft size={15} /> {idn.name}</button>
          <input className="hb-name-input" value={h.name} placeholder="Habit name" onChange={(e) => patchHabit(idn.id, h.id, (x) => ({ ...x, name: e.target.value }))} />
          <div className="hb-divider" />
          <div className="hb-stats">
            <div className="hb-stat"><div className="hb-stat-num amber">{cur}</div><div className="hb-stat-label">Current streak</div></div>
            <div className="hb-stat"><div className="hb-stat-num">{longest}</div><div className="hb-stat-label">Longest</div></div>
            <div className="hb-stat"><div className="hb-stat-num">{rate}%</div><div className="hb-stat-label">30 days</div></div>
          </div>
          <div className="hb-divider" />
          <div className="hb-section-label">Schedule</div>
          <div className="hb-days">
            {ALL_DAYS.map((d) => (<button key={d} className={"hb-daychip" + (h.schedule.includes(d) ? " on" : "")} onClick={() => toggleSchedDay(idn.id, h.id, d)}>{DOW_FULL[d]}</button>))}
          </div>
          <div className="hb-divider" />
          <div className="hb-section-label">{monthName}</div>
          <div className="hb-cal">
            {DOW.map((d, i) => (<div key={"h" + i} className="hb-cal-head">{d}</div>))}
            {Array.from({ length: lead }).map((_, i) => (<div key={"b" + i} className="hb-cal-blank" />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1; const date = new Date(year, month, day); const iso = toISO(date);
              const done = !!h.log[iso]; const sched = isScheduled(h, date); const future = date > TODAY; const isToday = iso === TODAY_ISO;
              let cls = "hb-cal-cell";
              if (future) cls += " future"; else if (done) cls += " done"; else if (sched) cls += " missed"; else cls += " off";
              if (isToday) cls += " today";
              const clickable = !future && sched;
              return (<div key={day} className={cls} onClick={() => clickable && toggleDay(idn.id, h.id, iso, isToday)}>{day}</div>);
            })}
          </div>
          <div className="hb-divider" />
          <button className="hb-btn danger" onClick={() => deleteHabit(idn.id, h.id)}><Trash2 size={15} /> Delete habit</button>
        </div>
      </div>
    );
  }

  // ---------- IDENTITY DETAIL ----------
  if (idn) {
    const total = idn.habits.length;
    return (
      <div className="hb-root"><style>{cssHabit}</style>
        <div className="hb-wrap">
          <button className="hb-back" onClick={() => setSelIdn(null)}><ArrowLeft size={15} /> All identities</button>
          <span className="hb-eyebrow">I want to become</span>
          <input className="hb-name-input" style={{ marginTop: 8 }} value={idn.name} placeholder="e.g. A guitarist" onChange={(e) => patchIdentity(idn.id, { name: e.target.value })} />
          <div className="hb-divider" />
          <div style={{ marginBottom: 16 }}>
            <button className="hb-btn suggest" onClick={() => generateHabits(idn)} disabled={generating}>
              <Sparkles size={15} className={generating ? "hb-spin" : ""} />{generating ? "Drafting habits…" : "Suggest habits with AI"}
            </button>
          </div>
          <div className="hb-add">
            <input className="hb-add-input" placeholder="Add a habit manually…" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit(idn.id)} />
            <button className="hb-iconbtn" onClick={() => addHabit(idn.id)} aria-label="Add"><Plus size={20} /></button>
          </div>
          {total === 0 ? (
            <div className="suite-empty"><p className="hb-empty">No habits for this identity yet. Let AI suggest some, then edit freely.</p></div>
          ) : (
            <div className="hb-list">{idn.habits.map((h) => HabitCard(h, idn.id))}</div>
          )}
          <div className="hb-divider" />
          <button className="hb-btn danger" onClick={() => deleteIdentity(idn.id)}><Trash2 size={15} /> Delete identity</button>
        </div>
      </div>
    );
  }

  // ---------- HOME (tabs) ----------
  return (
    <div className="hb-root"><style>{cssHabit}</style>
      <div className="hb-wrap">
        <div className="suite-head"><div><span className="hb-eyebrow">Become yourself, one day at a time</span>
        <h1 className="hb-h1" style={{ margin: "3px 0 0" }}>Habits</h1></div></div>
        <div className="hb-tabs">
          <button className={"hb-tab" + (tab === "today" ? " on" : "")} onClick={() => setTab("today")}>Today</button>
          <button className={"hb-tab" + (tab === "identities" ? " on" : "")} onClick={() => setTab("identities")}>Identities</button>
        </div>

        {tab === "today" ? (() => {
          const groups = identities
            .map((x) => ({ idn: x, habits: x.habits.filter((h) => isScheduled(h, TODAY)) }))
            .filter((g) => g.habits.length > 0);
          const totalT = groups.reduce((a, g) => a + g.habits.length, 0);
          const doneT = groups.reduce((a, g) => a + g.habits.filter((h) => h.log[TODAY_ISO]).length, 0);
          if (identities.length === 0)
            return <div className="suite-empty"><p className="hb-empty">Nothing here yet. Open the Identities tab and start with someone you want to become.</p></div>;
          if (totalT === 0)
            return <div className="suite-empty"><p className="hb-empty">No habits scheduled today. Enjoy your day.</p></div>;
          return (
            <>
              <div className="hb-summary">{doneT} of {totalT} done today</div>
              {groups.map((g) => (
                <div key={g.idn.id}>
                  <div className="hb-grouplabel">
                    <span className="name">{g.idn.name}</span>
                    <span className="count">{g.habits.filter((h) => h.log[TODAY_ISO]).length}/{g.habits.length}</span>
                  </div>
                  {g.habits.map((h) => {
                    const cur = currentStreak(h); const doneToday = !!h.log[TODAY_ISO];
                    return (
                      <div key={h.id} className={"hb-row" + (doneToday ? " done" : "")}>
                        <span className="hb-row-name">{h.name}</span>
                        <div className={"hb-streak" + (cur > 0 ? " live" : "")}><Flame size={14} /><b style={{ fontSize: 16 }}>{cur}</b></div>
                        <button className={"hb-toggle sm" + (doneToday ? " on" : "") + (popId === h.id ? " pop" : "")} onClick={() => toggleDay(g.idn.id, h.id, TODAY_ISO, true)} aria-label={doneToday ? "Undo" : "Mark done"}>
                          {doneToday && <Check size={19} strokeWidth={3} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          );
        })() : (
          <>
            <div className="hb-add">
              <input className="hb-add-input" placeholder="New identity… (e.g. A guitarist)" value={newIdn} onChange={(e) => setNewIdn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIdentity()} />
              <button className="hb-iconbtn" onClick={addIdentity} aria-label="Add identity"><Plus size={20} /></button>
            </div>
            {identities.length === 0 ? (
              <div className="suite-empty"><p className="hb-empty">Who do you want to become? Write one identity — "A guitarist", "A healthy person", "A writer" — then fill it with habits that prove it.</p></div>
            ) : (
              <div className="hb-list">
                {identities.map((x) => {
                  const tot = x.habits.length;
                  const schedToday = x.habits.filter((h) => isScheduled(h, TODAY));
                  const doneToday = schedToday.filter((h) => h.log[TODAY_ISO]).length;
                  return (
                    <div key={x.id} className="hb-idcard" onClick={() => setSelIdn(x.id)}>
                      <div className="hb-idcard-name">{x.name}</div>
                      <div className="hb-idcard-meta">{tot} habits{schedToday.length > 0 ? ` · today ${doneToday}/${schedToday.length}` : ""}</div>
                      {schedToday.length > 0 && (<div className="hb-idcard-bar"><div className="hb-idcard-fill" style={{ width: (doneToday / schedToday.length) * 100 + "%" }} /></div>)}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===== TODO =====

const TODO_KEY = "todos:state:v1";

const cssTodo = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');
.td-root{ --ink:#1f2320; --ink2:#9a9e98; --amber:#E0913A; --amber-d:#c5772a; --card:#ffffff; --line:#ecebe4; --track:#f0eee7; min-height:100vh; background:transparent; color:var(--ink); font-family:'Hanken Grotesk',system-ui,sans-serif; -webkit-font-smoothing:antialiased;}
.td-root *{box-sizing:border-box;}
.td-wrap{max-width:520px; margin:0 auto; padding:34px 24px 100px;}
.td-eyebrow{font-family:'Spline Sans Mono',monospace; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink2);}
.td-h1{font-family:'Fraunces',serif; font-weight:500; font-size:28px; letter-spacing:-.01em; margin:8px 0 4px; color:var(--ink);}
.td-sub{color:var(--ink2); font-size:14px; margin-bottom:24px;}
.td-capture{display:flex; gap:10px; margin-bottom:8px; align-items:stretch;}
.td-capture-input{flex:1; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px 17px; color:var(--ink); font-size:16px; outline:none; font-family:inherit; transition:border-color .15s;}
.td-capture-input:focus{border-color:var(--amber);}
.td-capture-input::placeholder{color:#bcbfb9;}
.td-addbtn{background:var(--amber); border:none; border-radius:14px; width:54px; display:grid; place-items:center; color:#fff; cursor:pointer; flex-shrink:0; transition:background .15s;}
.td-addbtn:hover{background:var(--amber-d);}
.td-hint{font-family:'Spline Sans Mono',monospace; font-size:11px; color:#bcbfb9; margin-bottom:28px; letter-spacing:.03em;}
.td-sectlabel{display:flex; align-items:center; gap:8px; margin:26px 0 10px;}
.td-sectlabel .t{font-family:'Spline Sans Mono',monospace; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink2);}
.td-sectlabel.today .t{color:var(--amber-d);}
.td-sectlabel .line{flex:1; height:1px; background:var(--line);}
.td-clear{background:none; border:none; color:#bcbfb9; font-family:inherit; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; padding:2px;}
.td-clear:hover{color:#c0573a;}
.td-list{display:flex; flex-direction:column; gap:7px;}
.td-task{display:flex; align-items:center; gap:13px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 15px; transition:border-color .15s, opacity .2s;}
.td-task:hover{border-color:#dad8cf;}
.td-task.done{opacity:.5;}
.td-check{flex-shrink:0; width:22px; height:22px; border-radius:7px; border:1.5px solid #d6d4ca; background:transparent; cursor:pointer; display:grid; place-items:center; color:#fff; transition:all .15s;}
.td-check.on{background:var(--amber); border-color:var(--amber);}
.td-check.pop{animation:tdpop .3s ease;}
@keyframes tdpop{0%{transform:scale(.8);}50%{transform:scale(1.15);}100%{transform:scale(1);}}
.td-text{flex:1; font-size:15.5px; line-height:1.4; word-break:break-word; color:var(--ink);}
.td-task.done .td-text{text-decoration:line-through;}
.td-sun{background:none; border:none; color:#d6d4ca; cursor:pointer; padding:3px; flex-shrink:0; transition:color .15s;}
.td-sun:hover{color:var(--ink2);}
.td-sun.on{color:var(--amber);}
.td-del{background:none; border:none; color:#d6d4ca; cursor:pointer; padding:3px; flex-shrink:0; opacity:0; transition:opacity .15s, color .15s;}
.td-task:hover .td-del{opacity:1;}
.td-del:hover{color:var(--ink);}
.td-empty{color:var(--ink2); font-size:14px; padding:14px 0; line-height:1.6;}
@media (prefers-reduced-motion: reduce){.td-check,.td-sun,.td-del{transition:none;} .td-check.pop{animation:none;}}
`;


function TodoApp() {
  const [loaded, setLoaded] = useState(false);
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [popId, setPopId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(TODO_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (Array.isArray(d.todos)) setTodos(d.todos);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(TODO_KEY, JSON.stringify({ todos })); }
      catch (e) { console.error("save failed", e); }
    })();
  }, [todos, loaded]);

  const chime = async () => {
    try {
      await Tone.start();
      const s = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 } }).toDestination();
      s.volume.value = -14; s.triggerAttackRelease("A5", "32n");
    } catch (e) {}
  };

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((xs) => [{ id: uid(), text: t, done: false, today: false, createdAt: Date.now() }, ...xs]);
    setText("");
    if (inputRef.current) inputRef.current.focus(); // tetap fokus untuk tangkap beruntun
  };
  const toggle = (id) =>
    setTodos((xs) => xs.map((x) => {
      if (x.id !== id) return x;
      if (!x.done) { chime(); setPopId(id); setTimeout(() => setPopId(null), 320); }
      return { ...x, done: !x.done };
    }));
  const toggleToday = (id) => setTodos((xs) => xs.map((x) => (x.id === id ? { ...x, today: !x.today } : x)));
  const remove = (id) => setTodos((xs) => xs.filter((x) => x.id !== id));
  const clearDone = () => setTodos((xs) => xs.filter((x) => !x.done));

  if (!loaded) return (<div className="td-root"><style>{cssTodo}</style><div className="td-wrap"><p className="td-sub">Loading…</p></div></div>);

  const today = todos.filter((x) => !x.done && x.today);
  const later = todos.filter((x) => !x.done && !x.today);
  const done = todos.filter((x) => x.done);
  const activeCount = today.length + later.length;

  const Task = (x) => (
    <div key={x.id} className={"td-task" + (x.done ? " done" : "")}>
      <button className={"td-check" + (x.done ? " on" : "") + (popId === x.id ? " pop" : "")} onClick={() => toggle(x.id)} aria-label={x.done ? "Mark not done" : "Mark done"}>
        {x.done && <Check size={15} strokeWidth={3} />}
      </button>
      <span className="td-text">{x.text}</span>
      {!x.done && (
        <button className={"td-sun" + (x.today ? " on" : "")} onClick={() => toggleToday(x.id)} aria-label={x.today ? "Move to Later" : "Do it today"} title={x.today ? "Move to Later" : "Do it today"}>
          <Sun size={17} fill={x.today ? "currentColor" : "none"} />
        </button>
      )}
      <button className="td-del" onClick={() => remove(x.id)} aria-label="Delete"><X size={17} /></button>
    </div>
  );

  return (
    <div className="td-root"><style>{cssTodo}</style>
      <div className="td-wrap">
        <div className="suite-head"><div><span className="td-eyebrow">Get it out of your head</span>
        <h1 className="td-h1" style={{ margin: "3px 0 0" }}>Tasks</h1></div></div>
        <p className="td-sub">Capture anything fast. Tap the sun for what you\u2019ll do today.</p>

        <div className="td-capture">
          <input
            ref={inputRef}
            className="td-capture-input"
            placeholder="Add a task… (Enter to save)"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="td-addbtn" onClick={add} aria-label="Add"><Plus size={22} /></button>
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

// ===== shell with bottom navigation =====
export default function App() {
  const [tab, setTab] = useState("focus");
  const [focusImmersive, setFocusImmersive] = useState(false);
  return (
    <div className="suite-root">
      <style>{NAV_CSS}</style>
      <div style={{ display: tab === "focus" ? "block" : "none" }}><FocusApp active={tab === "focus"} onImmersive={setFocusImmersive} /></div>
      <div style={{ display: tab === "habit" ? "block" : "none" }}><HabitApp /></div>
      <div style={{ display: tab === "todo" ? "block" : "none" }}><TodoApp /></div>
      {!focusImmersive && (
        <nav className="suite-nav">
          <div className="suite-nav-inner">
            <button className={"suite-tab" + (tab === "focus" ? " on" : "")} onClick={() => setTab("focus")}><Target size={20} /><span>Focus</span></button>
            <button className={"suite-tab" + (tab === "habit" ? " on" : "")} onClick={() => setTab("habit")}><Flame size={20} /><span>Habits</span></button>
            <button className={"suite-tab" + (tab === "todo" ? " on" : "")} onClick={() => setTab("todo")}><ListChecks size={20} /><span>Tasks</span></button>
          </div>
        </nav>
      )}
    </div>
  );
}
