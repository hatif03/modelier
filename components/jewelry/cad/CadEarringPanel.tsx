"use client";

import type { EarringDesign } from "@/lib/jewelry/cad/schema/earring";
import { Slider } from "@/components/ui/slider";
import Field from "./fields/Field";

// Sub-style (stud/hoop/dangle) is chosen at creation time in NewDesignTiles.tsx —
// these are structurally different feature trees, not parameter variations, so this
// panel doesn't offer a way to switch between them after the fact.
const CadEarringPanel = ({ design, onChange }: { design: EarringDesign; onChange: (next: EarringDesign) => void }) => {
  if (design.style === "hoop") {
    return (
      <div className="flex flex-col gap-4 p-3">
        <p className="text-[10px] text-muted-foreground">Hoop — hinge/latch mechanics aren&apos;t modeled, this is the open band shape only.</p>
        <Field label={`Band thickness — ${design.band.thicknessMm.toFixed(1)}mm`}>
          <Slider
            value={[design.band.thicknessMm]}
            min={0.8}
            max={4}
            step={0.1}
            onValueChange={([v]) => onChange({ ...design, band: { ...design.band, thicknessMm: v } })}
          />
        </Field>
        <Field label={`Opening — ${design.band.sweepAngleDeg}°`}>
          <Slider
            value={[design.band.sweepAngleDeg]}
            min={270}
            max={360}
            step={5}
            onValueChange={([v]) => onChange({ ...design, band: { ...design.band, sweepAngleDeg: v } })}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <Field label={`Post length — ${design.post.lengthMm}mm`}>
        <Slider
          value={[design.post.lengthMm]}
          min={6}
          max={14}
          step={0.5}
          onValueChange={([v]) => onChange({ ...design, post: { ...design.post, lengthMm: v } })}
        />
      </Field>
      {design.setting.gemstone && (
        <Field label={`Gemstone width — ${design.setting.gemstone.widthMm.toFixed(1)}mm`}>
          <Slider
            value={[design.setting.gemstone.widthMm]}
            min={2}
            max={8}
            step={0.1}
            onValueChange={([v]) =>
              onChange({ ...design, setting: { ...design.setting, gemstone: { ...design.setting.gemstone!, widthMm: v } } })
            }
          />
        </Field>
      )}
      {design.style === "dangle" && (
        <Field label={`Drop length — ${design.dropLengthMm}mm`}>
          <Slider
            value={[design.dropLengthMm]}
            min={10}
            max={50}
            step={1}
            onValueChange={([v]) => onChange({ ...design, dropLengthMm: v })}
          />
        </Field>
      )}
    </div>
  );
};

export default CadEarringPanel;
