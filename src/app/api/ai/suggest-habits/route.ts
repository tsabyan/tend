import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { gemini, GEMINI_MODEL, requireUser } from "@/lib/ai";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const { identity } = await request.json();
  if (typeof identity !== "string" || !identity.trim()) {
    return NextResponse.json({ error: "identity is required" }, { status: 400 });
  }

  try {
    const res = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Identity/aspiration: "${identity.trim().slice(0, 200)}"\nSuggest 4-6 small, concrete, repeatable habits that embody it. Keep each name under 8 words. days: weekday numbers 0-6 (0=Sunday); use [0,1,2,3,4,5,6] for daily.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          minItems: "4",
          maxItems: "6",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              days: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            },
            required: ["name", "days"],
          },
        },
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 500,
      },
    });
    const parsed: unknown = JSON.parse(res.text ?? "");
    if (!Array.isArray(parsed)) throw new Error("not an array");
    const habits = parsed
      .filter(
        (o): o is { name: string; days?: unknown } =>
          !!o && typeof o === "object" &&
          typeof (o as { name?: unknown }).name === "string" &&
          (o as { name: string }).name.trim().length > 0
      )
      .map((o) => {
        let days = Array.isArray(o.days)
          ? o.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
          : [];
        if (days.length === 0) days = [...ALL_DAYS];
        return { name: o.name.trim(), days };
      });
    if (habits.length === 0) throw new Error("empty");
    return NextResponse.json({ habits });
  } catch {
    return NextResponse.json({ error: "Couldn’t draft habits" }, { status: 502 });
  }
}
