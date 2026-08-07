"use client";

import { useState } from "react";
import { fabric } from "fabric";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PillGroup } from "@/components/ui/pill-button";
import { FORMATS } from "@/lib/formats";
import { buildResizedCanvasJson } from "@/lib/magicResize";

type Props = {
  fabricRef: React.RefObject<fabric.Canvas | null>;
  projectId?: string;
  initialName?: string;
};

// The stashed canvas JSON is picked up by app/App.tsx's Home component on
// the new project's first mount (see the "magic-resize:" sessionStorage read
// there) — there's no server-side Liveblocks room population today, so a
// same-tab handoff via sessionStorage is what gets the resized shapes into
// the new room without touching the real-time sync internals at all.
const MagicResize = ({ fabricRef, projectId, initialName }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formatId, setFormatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!projectId) return null;

  const handleCreate = async () => {
    const canvas = fabricRef.current;
    const target = FORMATS.find((f) => f.id === formatId);
    if (!canvas || !target) return;

    setIsCreating(true);
    setError(null);
    try {
      const resized = buildResizedCanvasJson(
        canvas.getObjects(),
        { width: canvas.width ?? target.width, height: canvas.height ?? target.height },
        { width: target.width, height: target.height }
      );

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${initialName ?? "Untitled design"} — ${target.label}`, format: target.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create the resized design.");

      sessionStorage.setItem(`magic-resize:${json.project.id}`, JSON.stringify(resized));
      router.push(`/design/${json.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the resized design.");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Magic Resize</h3>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-border bg-background hover:border-accent hover:bg-background hover:text-accent"
          >
            Resize to another format
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize this design</DialogTitle>
            <DialogDescription>
              Creates a new design at the target size with everything scaled to fit — the original is untouched.
            </DialogDescription>
          </DialogHeader>
          <PillGroup
            options={FORMATS.map((f) => ({ id: f.id, label: f.label }))}
            value={formatId}
            onChange={setFormatId}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button disabled={!formatId || isCreating} onClick={handleCreate}>
              {isCreating ? "Creating…" : "Create resized copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MagicResize;
