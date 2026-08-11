import type { Clip, ColorGradePresetId } from "@/lib/video-engine/types";
import { isMediaClip } from "@/lib/video-engine/types";

export type AutoAssemblePlan = { order: string[]; colorGradePresetId?: ColorGradePresetId; notes?: string };

export async function requestAutoAssemblePlan(input: {
  templateLabel: string;
  pacing: { hookEndsAt: number; ctaStartsAt: number };
  clips: { id: string; name: string; durationMs: number; transcriptText?: string }[];
}): Promise<AutoAssemblePlan> {
  const res = await fetch("/api/video/auto-assemble", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clips: input.clips, templateLabel: input.templateLabel, pacing: input.pacing }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Auto-assembly failed.");
  return json.plan;
}

// Re-sequences clips per the plan's order (back-to-back, durations unchanged)
// and applies the suggested color grade to every media clip that was reordered.
export function applyAutoAssemblePlan(clips: Clip[], plan: AutoAssemblePlan): Clip[] {
  const byId = new Map(clips.map((c) => [c.id, c]));
  const ordered = plan.order.map((id) => byId.get(id)).filter((c): c is Clip => Boolean(c));
  const untouched = clips.filter((c) => !plan.order.includes(c.id));

  let cursor = 0;
  const relaid = ordered.map((clip) => {
    const positioned: Clip = { ...clip, startMs: cursor };
    cursor += clip.durationMs;
    if (plan.colorGradePresetId && isMediaClip(positioned)) {
      return { ...positioned, colorGradePresetId: plan.colorGradePresetId };
    }
    return positioned;
  });

  return [...relaid, ...untouched];
}
