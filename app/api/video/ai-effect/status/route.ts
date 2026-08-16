import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getVideoEffectStatus } from "@/lib/youcam/video";

// Sibling status route to POST /api/video/ai-effect — mirrors
// app/api/generations/[id]/status/route.ts's single-poll-per-hit pattern
// (one getTaskStatus check per hit, no internal retry loop), but keyed by
// {taskId, feature} query params directly since there's no Generation row
// to look up through here.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId");
  const feature = url.searchParams.get("feature");
  if (!taskId || !feature) {
    return NextResponse.json({ error: "taskId and feature are required." }, { status: 400 });
  }

  const result = await getVideoEffectStatus(feature, taskId);
  return NextResponse.json({ result });
}
