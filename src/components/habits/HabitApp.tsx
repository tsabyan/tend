"use client";

import { useEffect, useState } from "react";
import { Plus, Check, ArrowLeft, Sparkles, Trash2, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { chimeHabit } from "@/lib/chime";
import { useDebounced } from "@/lib/useDebounced";
import {
  toISO, startOfDay, DOW, DOW_FULL, ALL_DAYS,
  isScheduled, schedLabel, currentStreak, longestStreak, rate30,
} from "@/lib/dates";
import type { Identity, Habit } from "@/lib/types";

type Logs = Record<string, Set<string>>; // habit_id -> set of ISO days

export default function HabitApp() {
  // createBrowserClient is a module-level singleton, so this is stable across renders
  const supabase = createClient();
  const confirm = useConfirm();
  const [loaded, setLoaded] = useState(false);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Logs>({});
  const [tab, setTab] = useState<"today" | "identities">("today");
  const [selIdn, setSelIdn] = useState<string | null>(null);
  const [selHabit, setSelHabit] = useState<string | null>(null);
  const [newIdn, setNewIdn] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [generating, setGenerating] = useState(false);
  const [popId, setPopId] = useState<string | null>(null);

  const TODAY = startOfDay(new Date());
  const TODAY_ISO = toISO(TODAY);

  useEffect(() => {
    (async () => {
      const [idnRes, habRes, logRes] = await Promise.all([
        supabase.from("identities").select("id, name, created_at").order("created_at"),
        supabase.from("habits").select("id, identity_id, name, schedule, created_at").order("created_at"),
        supabase.from("habit_logs").select("habit_id, day"),
      ]);
      if (idnRes.data) setIdentities(idnRes.data);
      if (habRes.data) setHabits(habRes.data);
      if (logRes.data) {
        const m: Logs = {};
        for (const row of logRes.data) {
          (m[row.habit_id] ??= new Set()).add(row.day);
        }
        setLogs(m);
      }
      setLoaded(true);
    })();
  }, [supabase]);

  const logOf = (habitId: string) => logs[habitId] ?? new Set<string>();

  const addIdentity = async () => {
    const n = newIdn.trim();
    if (!n) return;
    setNewIdn("");
    const { data, error } = await supabase
      .from("identities").insert({ name: n }).select("id, name, created_at").single();
    if (error || !data) { alert("Couldn’t save the identity. Try again."); return; }
    setIdentities((xs) => [...xs, data]);
  };

  const persistIdentityName = useDebounced((id: string, name: string) => {
    supabase.from("identities").update({ name }).eq("id", id).then();
  });
  const patchIdentityName = (id: string, name: string) => {
    setIdentities((xs) => xs.map((x) => (x.id === id ? { ...x, name } : x)));
    persistIdentityName(id, name);
  };

  const deleteIdentity = async (id: string) => {
    if (!(await confirm({ title: "Delete identity", message: "Delete this identity and all its habits? This can’t be undone." }))) return;
    const habitIds = habits.filter((h) => h.identity_id === id).map((h) => h.id);
    setIdentities((xs) => xs.filter((x) => x.id !== id));
    setHabits((hs) => hs.filter((h) => h.identity_id !== id));
    setLogs((m) => {
      const next = { ...m };
      habitIds.forEach((hid) => delete next[hid]);
      return next;
    });
    setSelIdn(null);
    supabase.from("identities").delete().eq("id", id).then();
  };

  const addHabit = async (idnId: string) => {
    const n = newHabit.trim();
    if (!n) return;
    setNewHabit("");
    const { data, error } = await supabase
      .from("habits").insert({ identity_id: idnId, name: n })
      .select("id, identity_id, name, schedule, created_at").single();
    if (error || !data) { alert("Couldn’t save the habit. Try again."); return; }
    setHabits((hs) => [...hs, data]);
  };

  const persistHabitName = useDebounced((id: string, name: string) => {
    supabase.from("habits").update({ name }).eq("id", id).then();
  });
  const patchHabitName = (id: string, name: string) => {
    setHabits((hs) => hs.map((h) => (h.id === id ? { ...h, name } : h)));
    persistHabitName(id, name);
  };

  const deleteHabit = async (id: string) => {
    if (!(await confirm({ title: "Delete habit", message: "Delete this habit? This can’t be undone." }))) return;
    setHabits((hs) => hs.filter((h) => h.id !== id));
    setLogs((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    setSelHabit(null);
    supabase.from("habits").delete().eq("id", id).then();
  };

  const toggleDay = (habitId: string, iso: string, isToday: boolean) => {
    const has = logOf(habitId).has(iso);
    setLogs((m) => {
      const set = new Set(m[habitId] ?? []);
      if (has) set.delete(iso);
      else set.add(iso);
      return { ...m, [habitId]: set };
    });
    if (!has && isToday) {
      chimeHabit();
      setPopId(habitId);
      setTimeout(() => setPopId(null), 320);
    }
    if (has) supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("day", iso).then();
    else supabase.from("habit_logs").insert({ habit_id: habitId, day: iso }).then();
  };

  const toggleSchedDay = (habitId: string, day: number) => {
    const h = habits.find((x) => x.id === habitId);
    if (!h) return;
    const has = h.schedule.includes(day);
    let s = has ? h.schedule.filter((d) => d !== day) : [...h.schedule, day];
    if (s.length === 0) s = [day];
    setHabits((hs) => hs.map((x) => (x.id === habitId ? { ...x, schedule: s } : x)));
    supabase.from("habits").update({ schedule: s }).eq("id", habitId).then();
  };

  const generateHabits = async (idn: Identity) => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/suggest-habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: idn.name }),
      });
      if (!res.ok) throw new Error("request failed");
      const { habits: drafted } = (await res.json()) as { habits: { name: string; days: number[] }[] };
      if (!drafted?.length) throw new Error("empty");
      const rows = drafted.map((o) => ({ identity_id: idn.id, name: o.name, schedule: o.days }));
      const { data, error } = await supabase
        .from("habits").insert(rows).select("id, identity_id, name, schedule, created_at");
      if (error || !data) throw new Error("insert failed");
      setHabits((hs) => [...hs, ...data]);
    } catch {
      alert("Couldn’t draft habits. Try again, or add manually.");
    } finally {
      setGenerating(false);
    }
  };

  if (!loaded)
    return (<div className="hb-root"><div className="hb-wrap"><p className="hb-sub">Loading…</p></div></div>);

  const idn = identities.find((x) => x.id === selIdn) || null;
  const idnHabits = idn ? habits.filter((h) => h.identity_id === idn.id) : [];
  const habitDetail = idn ? idnHabits.find((h) => h.id === selHabit) : null;

  const HabitCard = (h: Habit) => {
    const log = logOf(h.id);
    const cur = currentStreak(h, log, TODAY);
    const doneToday = log.has(TODAY_ISO);
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(TODAY);
      d.setDate(d.getDate() - i);
      const iso = toISO(d);
      const sched = isScheduled(h, d);
      let cls = "hb-cell";
      if (log.has(iso)) cls += " done";
      else if (sched) cls += " missed";
      else cls += " off";
      if (iso === TODAY_ISO) cls += " today";
      cells.push(<div key={iso} className={cls} />);
    }
    return (
      <div key={h.id} className="hb-card">
        <div className="hb-card-head">
          <div className="hb-card-left" onClick={() => setSelHabit(h.id)}>
            <div className="hb-name">{h.name}</div>
            <div className="hb-sched">{schedLabel(h.schedule)} · {cur > 0 ? `streak ${cur}` : "not started"}</div>
          </div>
          <div className={"hb-streak" + (cur > 0 ? " live" : "")}><Flame size={15} /><b>{cur}</b></div>
          <button
            className={"hb-toggle" + (doneToday ? " on" : "") + (popId === h.id ? " pop" : "")}
            onClick={() => toggleDay(h.id, TODAY_ISO, true)}
            aria-label={doneToday ? "Undo today" : "Mark today"}
          >
            {doneToday && <Check size={23} strokeWidth={3} />}
          </button>
        </div>
        <div className="hb-strip">{cells}</div>
      </div>
    );
  };

  // ---------- HABIT DETAIL ----------
  if (habitDetail && idn) {
    const h = habitDetail;
    const log = logOf(h.id);
    const cur = currentStreak(h, log, TODAY);
    const longest = longestStreak(h, log, TODAY);
    const rate = rate30(h, log, TODAY);
    const year = TODAY.getFullYear();
    const month = TODAY.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return (
      <div className="hb-root">
        <div className="hb-wrap">
          <button className="hb-back" onClick={() => setSelHabit(null)}><ArrowLeft size={15} /> {idn.name}</button>
          <input className="hb-name-input" value={h.name} placeholder="Habit name" onChange={(e) => patchHabitName(h.id, e.target.value)} />
          <div className="hb-divider" />
          <div className="hb-stats">
            <div className="hb-stat"><div className="hb-stat-num amber">{cur}</div><div className="hb-stat-label">Current streak</div></div>
            <div className="hb-stat"><div className="hb-stat-num">{longest}</div><div className="hb-stat-label">Longest</div></div>
            <div className="hb-stat"><div className="hb-stat-num">{rate}%</div><div className="hb-stat-label">30 days</div></div>
          </div>
          <div className="hb-divider" />
          <div className="hb-section-label">Schedule</div>
          <div className="hb-days">
            {ALL_DAYS.map((d) => (
              <button key={d} className={"hb-daychip" + (h.schedule.includes(d) ? " on" : "")} onClick={() => toggleSchedDay(h.id, d)}>{DOW_FULL[d]}</button>
            ))}
          </div>
          <div className="hb-divider" />
          <div className="hb-section-label">{monthName}</div>
          <div className="hb-cal">
            {DOW.map((d, i) => (<div key={"h" + i} className="hb-cal-head">{d}</div>))}
            {Array.from({ length: lead }).map((_, i) => (<div key={"b" + i} className="hb-cal-blank" />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const iso = toISO(date);
              const done = log.has(iso);
              const sched = isScheduled(h, date);
              const future = date > TODAY;
              const isToday = iso === TODAY_ISO;
              let cls = "hb-cal-cell";
              if (future) cls += " future";
              else if (done) cls += " done";
              else if (sched) cls += " missed";
              else cls += " off";
              if (isToday) cls += " today";
              const clickable = !future && sched;
              return (<div key={day} className={cls} onClick={() => clickable && toggleDay(h.id, iso, isToday)}>{day}</div>);
            })}
          </div>
          <div className="hb-divider" />
          <button className="hb-btn danger" onClick={() => deleteHabit(h.id)}><Trash2 size={15} /> Delete habit</button>
        </div>
      </div>
    );
  }

  // ---------- IDENTITY DETAIL ----------
  if (idn) {
    return (
      <div className="hb-root">
        <div className="hb-wrap">
          <button className="hb-back" onClick={() => setSelIdn(null)}><ArrowLeft size={15} /> All identities</button>
          <input className="hb-name-input" style={{ marginTop: 8 }} value={idn.name} placeholder="e.g. A guitarist" onChange={(e) => patchIdentityName(idn.id, e.target.value)} />
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
          {idnHabits.length === 0 ? (
            <div className="suite-empty"><p className="hb-empty">No habits for this identity yet. Let AI suggest some, then edit freely.</p></div>
          ) : (
            <div className="hb-list">{idnHabits.map(HabitCard)}</div>
          )}
          <div className="hb-divider" />
          <button className="hb-btn danger" onClick={() => deleteIdentity(idn.id)}><Trash2 size={15} /> Delete identity</button>
        </div>
      </div>
    );
  }

  // ---------- HOME (tabs) ----------
  return (
    <div className="hb-root">
      <div className="hb-wrap">
        <div className="suite-head"><div><span className="hb-eyebrow">Become yourself, one day at a time</span>
        <h1 className="hb-h1" style={{ margin: "3px 0 0" }}>Habits</h1></div></div>
        <div className="hb-tabs">
          <button className={"hb-tab" + (tab === "today" ? " on" : "")} onClick={() => setTab("today")}>Today</button>
          <button className={"hb-tab" + (tab === "identities" ? " on" : "")} onClick={() => setTab("identities")}>Identities</button>
        </div>

        {tab === "today" ? (() => {
          const groups = identities
            .map((x) => ({ idn: x, habits: habits.filter((h) => h.identity_id === x.id && isScheduled(h, TODAY)) }))
            .filter((g) => g.habits.length > 0);
          const totalT = groups.reduce((a, g) => a + g.habits.length, 0);
          const doneT = groups.reduce((a, g) => a + g.habits.filter((h) => logOf(h.id).has(TODAY_ISO)).length, 0);
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
                    <span className="count">{g.habits.filter((h) => logOf(h.id).has(TODAY_ISO)).length}/{g.habits.length}</span>
                  </div>
                  {g.habits.map((h) => {
                    const cur = currentStreak(h, logOf(h.id), TODAY);
                    const doneToday = logOf(h.id).has(TODAY_ISO);
                    return (
                      <div key={h.id} className={"hb-row" + (doneToday ? " done" : "")}>
                        <span className="hb-row-name">{h.name}</span>
                        <div className={"hb-streak" + (cur > 0 ? " live" : "")}><Flame size={14} /><b style={{ fontSize: 16 }}>{cur}</b></div>
                        <button
                          className={"hb-toggle sm" + (doneToday ? " on" : "") + (popId === h.id ? " pop" : "")}
                          onClick={() => toggleDay(h.id, TODAY_ISO, true)}
                          aria-label={doneToday ? "Undo" : "Mark done"}
                        >
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
              <div className="suite-empty"><p className="hb-empty">Who do you want to become? Write one identity — “A guitarist”, “A healthy person”, “A writer” — then fill it with habits that prove it.</p></div>
            ) : (
              <div className="hb-list">
                {identities.map((x) => {
                  const xh = habits.filter((h) => h.identity_id === x.id);
                  const schedToday = xh.filter((h) => isScheduled(h, TODAY));
                  const doneToday = schedToday.filter((h) => logOf(h.id).has(TODAY_ISO)).length;
                  return (
                    <div key={x.id} className="hb-idcard" onClick={() => setSelIdn(x.id)}>
                      <div className="hb-idcard-name">{x.name}</div>
                      <div className="hb-idcard-meta">{xh.length} habits{schedToday.length > 0 ? ` · today ${doneToday}/${schedToday.length}` : ""}</div>
                      {schedToday.length > 0 && (
                        <div className="hb-idcard-bar"><div className="hb-idcard-fill" style={{ width: (doneToday / schedToday.length) * 100 + "%" }} /></div>
                      )}
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
