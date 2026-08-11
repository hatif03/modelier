"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { Button } from "@/components/ui/button";

type Props = {
  category: JewelryCategory;
  tree: unknown;
  onApply: (nextTree: unknown) => void;
};

// Chat-style input for structured, schema-constrained edits (see
// lib/jewelry/cad/assistant.ts) — no arbitrary code generation/execution, the same
// safe pattern Video Studio's auto-assemble already established.
const CadAssistantPanel = ({ category, tree, onApply }: Props) => {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const run = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/jewelry-cad/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, prompt, tree }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The assistant couldn't process that request.");

      if (json.applied?.length > 0) onApply(json.tree);

      const parts = [];
      if (json.notes) parts.push(json.notes);
      if (json.rejected?.length > 0) parts.push(`Couldn't apply: ${json.rejected.map((r: any) => r.reason).join(" ")}`);
      setStatus(parts.join(" ") || "No changes made.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="text-[10px] text-muted-foreground">
        Describe a change — e.g. &quot;make the band thicker and switch to an oval sapphire&quot;. Adding or removing a whole feature
        (like a pendant) still needs the Design panel.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you want to change…"
        className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button size="sm" variant="gradient" disabled={busy || !prompt.trim()} onClick={run}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {busy ? "Thinking…" : "Apply"}
      </Button>
      {status && <p className="text-[10px] text-muted-foreground">{status}</p>}
    </div>
  );
};

export default CadAssistantPanel;
