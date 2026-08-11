"use client";

import type { BraceletDesign } from "@/lib/jewelry/cad/schema/bracelet";
import { Slider } from "@/components/ui/slider";
import Field from "./fields/Field";

const CadBraceletPanel = ({ design, onChange }: { design: BraceletDesign; onChange: (next: BraceletDesign) => void }) => {
  if (design.style === "chain") {
    return (
      <div className="flex flex-col gap-4 p-3">
        <Field label={`Length — ${design.chain.lengthMm}mm`}>
          <Slider
            value={[design.chain.lengthMm]}
            min={140}
            max={230}
            step={5}
            onValueChange={([v]) => onChange({ ...design, chain: { ...design.chain, lengthMm: v } })}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {design.style === "cuff" && (
        <p className="text-[10px] text-muted-foreground">Cuff — an open band with a wearing gap, no hinge mechanism modeled.</p>
      )}
      <Field label={`Band width — ${design.band.widthMm.toFixed(1)}mm`}>
        <Slider
          value={[design.band.widthMm]}
          min={3}
          max={15}
          step={0.5}
          onValueChange={([v]) => onChange({ ...design, band: { ...design.band, widthMm: v } })}
        />
      </Field>
      <Field label={`Band thickness — ${design.band.thicknessMm.toFixed(1)}mm`}>
        <Slider
          value={[design.band.thicknessMm]}
          min={1.5}
          max={6}
          step={0.5}
          onValueChange={([v]) => onChange({ ...design, band: { ...design.band, thicknessMm: v } })}
        />
      </Field>
      {design.style === "cuff" && (
        <Field label={`Opening — ${360 - design.band.sweepAngleDeg}°`}>
          <Slider
            value={[design.band.sweepAngleDeg]}
            min={260}
            max={350}
            step={5}
            onValueChange={([v]) => onChange({ ...design, band: { ...design.band, sweepAngleDeg: v } })}
          />
        </Field>
      )}
    </div>
  );
};

export default CadBraceletPanel;
