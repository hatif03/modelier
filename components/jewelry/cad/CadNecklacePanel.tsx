"use client";

import type { NecklaceDesign } from "@/lib/jewelry/cad/schema/necklace";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Field from "./fields/Field";

const CadNecklacePanel = ({ design, onChange }: { design: NecklaceDesign; onChange: (next: NecklaceDesign) => void }) => (
  <div className="flex flex-col gap-4 p-3">
    <Field label={`Chain length — ${design.chain.lengthMm}mm`}>
      <Slider
        value={[design.chain.lengthMm]}
        min={350}
        max={900}
        step={10}
        onValueChange={([v]) => onChange({ ...design, chain: { ...design.chain, lengthMm: v } })}
      />
    </Field>

    <Field label="Link style">
      <Select value={design.chain.linkStyle} onValueChange={(v) => onChange({ ...design, chain: { ...design.chain, linkStyle: v as typeof design.chain.linkStyle } })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cable">Cable</SelectItem>
          <SelectItem value="curb">Curb</SelectItem>
          <SelectItem value="rope">Rope</SelectItem>
          <SelectItem value="box">Box</SelectItem>
        </SelectContent>
      </Select>
    </Field>

    <Field label="Clasp">
      <Select value={design.clasp.type} onValueChange={(v) => onChange({ ...design, clasp: { ...design.clasp, type: v as typeof design.clasp.type } })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lobster">Lobster</SelectItem>
          <SelectItem value="springRing">Spring ring</SelectItem>
          <SelectItem value="toggle">Toggle</SelectItem>
          <SelectItem value="magnetic">Magnetic</SelectItem>
        </SelectContent>
      </Select>
    </Field>

    <Field label="Pendant">
      {design.pendant ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange({ ...design, pendant: undefined })}
        >
          Remove pendant
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...design,
              pendant: {
                offsetMm: 8,
                bailDiameterMm: 3,
                setting: { type: "bezel", bezelHeightMm: 2.4, bezelThicknessMm: 0.6, gemstone: { shape: "round", widthMm: 5, lengthMm: 5, depthMm: 3.2 } },
              },
            })
          }
        >
          Add pendant
        </Button>
      )}
    </Field>

    {design.pendant && (
      <Field label={`Pendant drop — ${design.pendant.offsetMm}mm`}>
        <Slider
          value={[design.pendant.offsetMm]}
          min={4}
          max={30}
          step={1}
          onValueChange={([v]) => onChange({ ...design, pendant: { ...design.pendant!, offsetMm: v } })}
        />
      </Field>
    )}
  </div>
);

export default CadNecklacePanel;
