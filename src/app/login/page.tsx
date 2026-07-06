"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sprout } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push("/");
        router.refresh();
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/");
        router.refresh();
        return;
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }
    setBusy(false);
  };

  return (
    <div className="auth-root">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-mark"><Sprout size={26} /></div>
        <span className="auth-eyebrow">Tend</span>
        <h1 className="auth-h1">{mode === "signin" ? "Welcome back" : "Create your space"}</h1>
        <p className="auth-sub">Goals, habits and tasks — one calm place.</p>
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}
        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
