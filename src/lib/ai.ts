import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Cheapest tier first; fall back when a model is overloaded (503) or rate-limited (429).
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

const isTransient = (err: unknown) => /"code":\s*(503|429)|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(String(err instanceof Error ? err.message : err));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Structured-output call with retry + model fallback. Returns the raw JSON text.
export async function generateJson(
  contents: string,
  responseSchema: object,
  maxOutputTokens: number
): Promise<string> {
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await gemini.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema,
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens,
          },
        });
        return res.text ?? "";
      } catch (err) {
        lastErr = err;
        if (!isTransient(err)) throw err;
        await sleep(700);
      }
    }
  }
  throw lastErr;
}

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
