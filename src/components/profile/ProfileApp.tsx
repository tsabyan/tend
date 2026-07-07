"use client";

import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileApp() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  const initial = (email?.[0] ?? "?").toUpperCase();

  return (
    <div className="pf-root">
      <div className="pf-wrap">
        <div className="suite-head"><div><span className="pf-eyebrow">You</span>
        <h1 className="pf-h1" style={{ margin: "3px 0 0" }}>Profile</h1></div></div>
        <p className="pf-sub">Your account and session.</p>

        <div className="pf-card">
          <div className="pf-avatar">{email ? initial : <User size={22} />}</div>
          <div className="pf-info">
            <div className="pf-label">Signed in as</div>
            <div className="pf-email">{email ?? "Loading…"}</div>
          </div>
        </div>

        <form action="/auth/signout" method="post" className="pf-form">
          <button className="pf-signout" type="submit"><LogOut size={17} /> Sign out</button>
        </form>
      </div>
    </div>
  );
}
