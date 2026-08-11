"use client";

import type { WatchDesign } from "@/lib/jewelry/cad/schema/watch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Field from "./fields/Field";

const CadWatchPanel = ({ design, onChange }: { design: WatchDesign; onChange: (next: WatchDesign) => void }) => (
  <div className="flex flex-col gap-4 p-3">
    <p className="text-[10px] text-muted-foreground">
      Case &amp; bezel only — Modelier doesn&apos;t model watch movements, dials, hands, or strap buckles.
    </p>

    <Field label={`Case diameter — ${design.caseShell.diameterMm ?? 38}mm`}>
      <Slider
        value={[design.caseShell.diameterMm ?? 38]}
        min={28}
        max={46}
        step={1}
        onValueChange={([v]) => onChange({ ...design, caseShell: { ...design.caseShell, diameterMm: v } })}
      />
    </Field>

    <Field label={`Case thickness — ${design.caseShell.thicknessMm}mm`}>
      <Slider
        value={[design.caseShell.thicknessMm]}
        min={6}
        max={14}
        step={0.5}
        onValueChange={([v]) => onChange({ ...design, caseShell: { ...design.caseShell, thicknessMm: v } })}
      />
    </Field>

    <Field label="Bezel style">
      <Select value={design.bezel.style} onValueChange={(v) => onChange({ ...design, bezel: { ...design.bezel, style: v as typeof design.bezel.style } })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="plain">Plain</SelectItem>
          <SelectItem value="fluted">Fluted</SelectItem>
          <SelectItem value="gem_set">Gem-set</SelectItem>
        </SelectContent>
      </Select>
    </Field>

    <Field label="Strap style">
      <Select
        value={design.strapAttachment.style}
        onValueChange={(v) => onChange({ ...design, strapAttachment: { ...design.strapAttachment, style: v as typeof design.strapAttachment.style } })}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="leather_look">Leather-look</SelectItem>
          <SelectItem value="metal_link_decorative">Metal link (decorative)</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  </div>
);

export default CadWatchPanel;
