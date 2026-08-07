"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  hex: string;
};

// Turns the garment/jewelry color already extracted for color-harmony
// scoring (lib/colorHarmony.ts) into a visible, one-click Brand Kit color —
// previously computed on every apparel/jewelry generation but never shown to
// the user at all.
const MagicPaletteBar = ({ hex }: Props) => {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveToBrandKit = async () => {
    setStatus("saving");
    try {
      const current = await fetch("/api/brand-kit").then((res) => res.json());
      const brandKit = current.brandKit ?? {};
      const form = new FormData();
      form.set("name", brandKit.name ?? "My Brand Kit");
      form.set("colors", JSON.stringify({ ...(brandKit.colors ?? {}), accent: hex }));
      if (brandKit.fontDisplay) form.set("fontDisplay", brandKit.fontDisplay);
      if (brandKit.fontBody) form.set("fontBody", brandKit.fontBody);
      const res = await fetch("/api/brand-kit", { method: "PUT", body: form });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
      <span className="h-8 w-8 shrink-0 rounded-full border border-border" style={{ backgroundColor: hex }} />
      <div className="flex flex-1 flex-col">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Magic Palette</span>
        <span className="font-serif text-sm text-foreground">{hex.toUpperCase()}</span>
      </div>
      <Button size="sm" variant="outline" disabled={status === "saving"} onClick={saveToBrandKit}>
        {status === "saved" ? "Saved ✓" : status === "saving" ? "Saving…" : "Save to Brand Kit"}
      </Button>
    </div>
  );
};

export default MagicPaletteBar;
