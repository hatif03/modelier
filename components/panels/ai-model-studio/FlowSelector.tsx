"use client";

import { AIStudioFlow } from "@/lib/ai-model-studio/types";
import { PillButton } from "@/components/ui/pill-button";

type Props = {
  flow: AIStudioFlow;
  onChange: (flow: AIStudioFlow) => void;
};

const FLOWS: { id: AIStudioFlow; label: string }[] = [
  { id: "apparel_vto", label: "Apparel" },
  { id: "makeup_vto", label: "Beauty" },
  { id: "jewelry_vto", label: "Jewelry" },
  { id: "image_to_video", label: "Video" },
];

const FlowSelector = ({ flow, onChange }: Props) => (
  <div className="grid grid-cols-2 gap-2 px-5 pt-4">
    {FLOWS.map((f) => (
      <PillButton
        key={f.id}
        active={flow === f.id}
        onClick={() => onChange(f.id)}
        className="py-2 text-center uppercase tracking-wide"
      >
        {f.label}
      </PillButton>
    ))}
  </div>
);

export default FlowSelector;
