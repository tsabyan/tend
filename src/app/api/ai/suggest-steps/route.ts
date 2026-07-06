import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateJson, requireUser } from "@/lib/ai";

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const { goal } = await request.json();
  if (typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  try {
    const text = await generateJson(
      `Goal: "${goal.trim().slice(0, 300)}"\nBreak it into 4-7 small, concrete, immediately actionable steps, in order. Keep each step under 12 words.`,
      { type: Type.ARRAY, items: { type: Type.STRING }, minItems: "4", maxItems: "7" },
      400
    );
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    const steps = parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    if (steps.length === 0) throw new Error("empty");
    return NextResponse.json({ steps });
  } catch (err) {
    console.error("suggest-steps failed:", err);
    return NextResponse.json({ error: "Couldn’t draft steps" }, { status: 502 });
  }
}
