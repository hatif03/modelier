"use client";

import { AIStudioFlow } from "@/lib/ai-model-studio/types";

type Props = {
  flow: AIStudioFlow;
  onChange: (flow: AIStudioFlow) => void;
};

const FlowSelector = ({ flow, onChange }: Props) => (
  <div className="flex gap-2 px-5 pt-4">
    <button
      onClick={() => onChange("apparel_vto")}
      className={`flex-1 rounded-sm border px-3 py-2 text-xs uppercase tracking-wide ${
        flow === "apparel_vto"
          ? "border-accent bg-accent/10 font-semibold text-foreground"
          : "border-border text-muted-foreground hover:border-accent/60"
      }`}
    >
      Apparel
    </button>
    <button
      onClick={() => onChange("makeup_vto")}
      className={`flex-1 rounded-sm border px-3 py-2 text-xs uppercase tracking-wide ${
        flow === "makeup_vto"
          ? "border-accent bg-accent/10 font-semibold text-foreground"
          : "border-border text-muted-foreground hover:border-accent/60"
      }`}
    >
      Beauty
    </button>
  </div>
);

export default FlowSelector;
