import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAssistantProvider } from "@/lib/assistant/providers";
import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { applyEdits, buildSystemPrompt, type ProposedEdit } from "@/lib/jewelry/cad/assistant";

const CATEGORIES: JewelryCategory[] = ["ring", "necklace", "earring", "bracelet", "watch"];

// Mirrors app/api/video/auto-assemble/route.ts's pattern exactly: reuse the shared
// provider-agnostic LLM backend, a category-specific system prompt describing the
// valid edit paths, and a plain-text JSON response (no tool-calling) — the same safe,
// constrained-edit approach used everywhere in this app, not raw code generation.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const category = body?.category;
  const prompt = body?.prompt;
  const tree = body?.tree;

  if (typeof category !== "string" || !CATEGORIES.includes(category as JewelryCategory)) {
    return NextResponse.json({ error: `category must be one of ${CATEGORIES.join(", ")}.` }, { status: 400 });
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required." }, { status: 400 });
  }

  try {
    const provider = getAssistantProvider();
    const systemPrompt = buildSystemPrompt(category as JewelryCategory);
    const result = await provider.chat([{ role: "user", content: prompt }], [], systemPrompt);
    if (result.type !== "text") throw new Error("Unexpected assistant response.");

    const match = result.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : result.text);
    const edits: ProposedEdit[] = Array.isArray(parsed.edits) ? parsed.edits : [];

    const { tree: nextTree, applied, rejected } = applyEdits(category as JewelryCategory, tree, edits);

    return NextResponse.json({ tree: nextTree, applied, rejected, notes: typeof parsed.notes === "string" ? parsed.notes : null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The assistant couldn't process that request." },
      { status: 502 }
    );
  }
}
