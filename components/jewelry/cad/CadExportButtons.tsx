"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { cadClient } from "@/lib/jewelry/cad/client";
import { Button } from "@/components/ui/button";

// Client-side download only — STL/STEP are for the designer's own manufacturing use
// (casting/3D printing), not served assets, so no server storage/route is needed.
const CadExportButtons = ({ category, tree, filenameBase }: { category: JewelryCategory; tree: unknown; filenameBase: string }) => {
  const [busy, setBusy] = useState<"stl" | "step" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (format: "stl" | "step") => {
    setBusy(format);
    setError(null);
    try {
      const blob = format === "stl" ? await cadClient.exportSTL(category, tree) : await cadClient.exportSTEP(category, tree);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => download("stl")}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {busy === "stl" ? "Exporting…" : "Export STL"}
      </Button>
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => download("step")}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {busy === "step" ? "Exporting…" : "Export STEP"}
      </Button>
    </div>
  );
};

export default CadExportButtons;
