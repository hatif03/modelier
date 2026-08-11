"use client";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import type { RingDesign } from "@/lib/jewelry/cad/schema/ring";
import type { NecklaceDesign } from "@/lib/jewelry/cad/schema/necklace";
import type { EarringDesign } from "@/lib/jewelry/cad/schema/earring";
import type { BraceletDesign } from "@/lib/jewelry/cad/schema/bracelet";
import type { WatchDesign } from "@/lib/jewelry/cad/schema/watch";

import CadRingPanel from "./CadRingPanel";
import CadNecklacePanel from "./CadNecklacePanel";
import CadEarringPanel from "./CadEarringPanel";
import CadBraceletPanel from "./CadBraceletPanel";
import CadWatchPanel from "./CadWatchPanel";

// Router picking a composer by category — mirrors ConfiguratorPanel.tsx's role for
// the 2D flows. Each category's designJson shape is structurally different (see
// lib/jewelry/cad/schema/*), so this stays a small switch rather than one generic
// JSON-Schema-driven form.
type Props = { category: JewelryCategory; design: unknown; onChange: (next: unknown) => void };

const CadPanel = ({ category, design, onChange }: Props) => {
  switch (category) {
    case "ring":
      return <CadRingPanel design={design as RingDesign} onChange={onChange as (v: RingDesign) => void} />;
    case "necklace":
      return <CadNecklacePanel design={design as NecklaceDesign} onChange={onChange as (v: NecklaceDesign) => void} />;
    case "earring":
      return <CadEarringPanel design={design as EarringDesign} onChange={onChange as (v: EarringDesign) => void} />;
    case "bracelet":
      return <CadBraceletPanel design={design as BraceletDesign} onChange={onChange as (v: BraceletDesign) => void} />;
    case "watch":
      return <CadWatchPanel design={design as WatchDesign} onChange={onChange as (v: WatchDesign) => void} />;
  }
};

export default CadPanel;
