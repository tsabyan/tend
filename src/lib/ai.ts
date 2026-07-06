import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Cheapest Gemini tier; suggestions are short structured JSON, no reasoning needed.
export const GEMINI_MODEL = "gemini-2.5-flash-lite";

// AI routes are only for signed-in users; returns null when authenticated.
export async function requireUser(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
