import type { EffectCategory } from "./effects";

// Effects that are built server-side (lib/firefly/client.ts) but not live —
// Firefly credentials aren't configured yet (see .env.example). Listed here
// purely for FlowSelector.tsx to render as a disabled "Soon" chip, so the
// roadmap is visible without pretending the feature works.
export type UpcomingEffect = {
  id: string;
  label: string;
  description: string;
  category: EffectCategory;
};

export const UPCOMING_EFFECTS: UpcomingEffect[] = [
  {
    id: "magic_expand",
    label: "Magic Expand",
    description: "Extend a photo's background with AI — powered by Adobe Firefly.",
    category: "accessories",
  },
  {
    id: "magic_eraser",
    label: "Magic Eraser",
    description: "Remove objects or blemishes from a photo — powered by Adobe Firefly.",
    category: "accessories",
  },
];
