import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAssistantProvider } from "@/lib/assistant/providers";
import { ASSISTANT_TOOLS } from "@/lib/assistant/tools";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant/systemPrompt";
import type { AssistantMessage } from "@/lib/assistant/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const messages = body?.messages as AssistantMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  try {
    const provider = getAssistantProvider();
    const result = await provider.chat(messages, ASSISTANT_TOOLS, ASSISTANT_SYSTEM_PROMPT);
    return NextResponse.json(result);
  } catch (err) {
    // Missing/invalid provider credentials land here too (see providers/index.ts's
    // requireEnv) — surfaced as a normal chat-visible error rather than a 500 page,
    // since "the configured provider isn't set up yet" is an expected state, not a bug.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The assistant couldn't process that request." },
      { status: 502 }
    );
  }
}
