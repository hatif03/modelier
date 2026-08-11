import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAssistantProvider } from "@/lib/assistant/providers";

// Template-driven auto-assembly's agentic step — given the raw clips already
// imported plus the chosen template's pacing rules, asks the Style Assistant's
// existing provider-agnostic LLM backend (lib/assistant/providers) to decide a
// clip order and a suggested grading preset. Deliberately scoped to ordering,
// not frame-accurate trim points — those come from the deterministic
// transcript-driven auto-edit pass, not LLM guesswork.
const COLOR_GRADE_IDS = ["none", "warm", "cool", "cinematic", "vibrant", "mono"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const clips = body?.clips;
  const templateLabel = typeof body?.templateLabel === "string" ? body.templateLabel : "General";
  const pacing = body?.pacing ?? {};

  if (!Array.isArray(clips) || clips.length === 0) {
    return NextResponse.json({ error: "clips is required." }, { status: 400 });
  }

  const systemPrompt = [
    `You are a video editing assistant arranging raw clips into a "${templateLabel}" video.`,
    `Pacing guidance: the hook should land by ${Math.round((pacing.hookEndsAt ?? 0.1) * 100)}% of the total runtime, and any call-to-action clip should start by ${Math.round((pacing.ctaStartsAt ?? 0.85) * 100)}%.`,
    `Respond with ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:`,
    `{"order": string[], "colorGradePresetId": ${COLOR_GRADE_IDS.map((id) => `"${id}"`).join(" | ")}, "notes": string}`,
    `"order" must contain every given clip id exactly once, reordered for the best pacing. "notes" is one short sentence explaining the choice.`,
  ].join("\n");

  try {
    const provider = getAssistantProvider();
    const result = await provider.chat([{ role: "user", content: JSON.stringify({ clips, pacing }) }], [], systemPrompt);
    if (result.type !== "text") throw new Error("Unexpected assistant response.");

    const match = result.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : result.text);

    if (!Array.isArray(parsed.order)) throw new Error("Assistant response was missing a clip order.");

    return NextResponse.json({ plan: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Auto-assembly couldn't be completed." },
      { status: 502 }
    );
  }
}
