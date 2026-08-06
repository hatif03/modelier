"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import Image from "next/image";
import { PackageOpen } from "lucide-react";

import { setSlotImage, type Slot, type SlotObjects } from "@/lib/jewelry/composeSlots";
import { Button } from "@/components/ui/button";

type JewelryPartOption = {
  id: string;
  partType: string;
  label: string;
  imageUrl: string;
  slot: Slot;
};

type Props = {
  category: string;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  initialPartSelections: Record<string, string>;
  onSelectionsChange: (selections: Record<string, string>) => void;
  onSwitchToSketch?: () => void;
};

const ConfiguratorPanel = ({ category, fabricRef, initialPartSelections, onSelectionsChange, onSwitchToSketch }: Props) => {
  const [options, setOptions] = useState<JewelryPartOption[] | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>(initialPartSelections);
  const slotObjectsRef = useRef<SlotObjects>(new Map());
  const restoredRef = useRef(false);

  useEffect(() => {
    fetch(`/api/jewelry-parts?category=${category}`)
      .then((res) => res.json())
      .then((json) => setOptions(json.jewelryPartOptions ?? []))
      .catch(() => setOptions([]));
  }, [category]);

  // Re-apply a previously-saved design's selections once the catalog has loaded and the
  // canvas exists — restoring an opened design, not a fresh one.
  useEffect(() => {
    if (!options || restoredRef.current || !fabricRef.current) return;
    restoredRef.current = true;

    Object.entries(selections).forEach(([partType, optionId]) => {
      const option = options.find((o) => o.id === optionId);
      if (!option || !fabricRef.current) return;
      setSlotImage({ canvas: fabricRef.current, partType, slot: option.slot, imageUrl: option.imageUrl, slotObjects: slotObjectsRef.current });
    });
  }, [options, fabricRef, selections]);

  if (!options) {
    return <p className="px-5 py-4 text-xs text-muted-foreground">Loading parts…</p>;
  }

  const partTypes = Array.from(new Set(options.map((o) => o.partType)));

  if (partTypes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <PackageOpen className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-foreground">Configurator parts aren&apos;t set up yet</p>
        <p className="text-xs text-muted-foreground">
          This category has no preset parts to choose from in this environment yet.
        </p>
        {onSwitchToSketch && (
          <Button size="sm" variant="outline" onClick={onSwitchToSketch}>
            Switch to Sketch instead
          </Button>
        )}
      </div>
    );
  }

  const handleSelect = async (option: JewelryPartOption) => {
    if (!fabricRef.current) return;
    await setSlotImage({
      canvas: fabricRef.current,
      partType: option.partType,
      slot: option.slot,
      imageUrl: option.imageUrl,
      slotObjects: slotObjectsRef.current,
    });
    const next = { ...selections, [option.partType]: option.id };
    setSelections(next);
    onSelectionsChange(next);
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      {partTypes.map((partType) => {
        const partOptions = options.filter((o) => o.partType === partType);
        return (
          <div key={partType} className="flex flex-col gap-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">{partType.replace(/_/g, " ")}</h3>
            {partOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No options yet for this part.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {partOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    title={option.label}
                    className={`flex flex-col items-center gap-1 rounded-sm border p-2 text-center ${
                      selections[partType] === option.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/60"
                    }`}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted/40">
                      <Image src={option.imageUrl} alt={option.label} fill unoptimized className="object-cover" />
                    </div>
                    <span className="truncate text-[10px] text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConfiguratorPanel;
