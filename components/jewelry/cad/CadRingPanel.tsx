"use client";

import type { RingDesign } from "@/lib/jewelry/cad/schema/ring";
import { US_RING_SIZES } from "@/lib/jewelry/cad/ringSizes";
import type { GemShapeType } from "@/lib/jewelry/gemShapes";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Field from "./fields/Field";

const GEM_SHAPES: { id: GemShapeType; label: string }[] = [
  { id: "round", label: "Round" },
  { id: "oval", label: "Oval" },
  { id: "marquise", label: "Marquise" },
  { id: "pear", label: "Pear" },
  { id: "emerald", label: "Emerald" },
];

type Props = {
  design: RingDesign;
  onChange: (next: RingDesign) => void;
};

const CadRingPanel = ({ design, onChange }: Props) => {
  const gemstone = design.setting.gemstone;

  return (
    <div className="flex flex-col gap-4 p-3">
      <Field label="Ring size (US)">
        <Select value={String(design.ringSizeUS)} onValueChange={(v) => onChange({ ...design, ringSizeUS: Number(v) })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {US_RING_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Metal color">
        <Select
          value={design.metal.color}
          onValueChange={(v) => onChange({ ...design, metal: { ...design.metal, color: v as typeof design.metal.color } })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yellow">Yellow gold</SelectItem>
            <SelectItem value="white">White gold</SelectItem>
            <SelectItem value="rose">Rose gold</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label={`Band width — ${design.band.widthMm.toFixed(1)}mm`}>
        <Slider
          value={[design.band.widthMm]}
          min={1}
          max={8}
          step={0.1}
          onValueChange={([v]) => onChange({ ...design, band: { ...design.band, widthMm: v } })}
        />
      </Field>

      <Field label={`Band thickness — ${design.band.thicknessMm.toFixed(1)}mm`}>
        <Slider
          value={[design.band.thicknessMm]}
          min={1}
          max={4}
          step={0.1}
          onValueChange={([v]) => onChange({ ...design, band: { ...design.band, thicknessMm: v } })}
        />
      </Field>

      <Field label="Band profile">
        <Select
          value={design.band.profileType}
          onValueChange={(v) => onChange({ ...design, band: { ...design.band, profileType: v as typeof design.band.profileType } })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="half-round">Half-round</SelectItem>
            <SelectItem value="comfort-fit">Comfort fit</SelectItem>
            <SelectItem value="knife-edge">Knife edge</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Setting">
        <Select
          value={design.setting.type}
          onValueChange={(v) =>
            onChange({
              ...design,
              setting:
                v === "prong"
                  ? { type: "prong", prongCount: 6, prongHeightMm: 3, prongThicknessMm: 0.9, gemstone }
                  : { type: "bezel", bezelHeightMm: 2.4, bezelThicknessMm: 0.6, gemstone },
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prong">Prong</SelectItem>
            <SelectItem value="bezel">Bezel</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {design.setting.type === "prong" && (
        <Field label="Prong count">
          <Select
            value={String(design.setting.prongCount)}
            onValueChange={(v) =>
              onChange({ ...design, setting: { ...design.setting, prongCount: Number(v) as 4 | 6 } as typeof design.setting })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Gemstone shape">
        <Select
          value={gemstone?.shape ?? "round"}
          onValueChange={(v) =>
            onChange({
              ...design,
              setting: { ...design.setting, gemstone: { ...(gemstone ?? { widthMm: 5, lengthMm: 5, depthMm: 3.2 }), shape: v as GemShapeType } },
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GEM_SHAPES.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {gemstone && (
        <>
          <Field label={`Gemstone width — ${gemstone.widthMm.toFixed(1)}mm`}>
            <Slider
              value={[gemstone.widthMm]}
              min={2}
              max={12}
              step={0.1}
              onValueChange={([v]) =>
                onChange({ ...design, setting: { ...design.setting, gemstone: { ...gemstone, widthMm: v } } })
              }
            />
          </Field>
          <Field label={`Gemstone length — ${gemstone.lengthMm.toFixed(1)}mm`}>
            <Slider
              value={[gemstone.lengthMm]}
              min={2}
              max={16}
              step={0.1}
              onValueChange={([v]) =>
                onChange({ ...design, setting: { ...design.setting, gemstone: { ...gemstone, lengthMm: v } } })
              }
            />
          </Field>
        </>
      )}
    </div>
  );
};

export default CadRingPanel;
