"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";

import { loadTemplateOntoCanvas } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProjectSummary = { id: string; name: string; updatedAt: string };

type Props = {
  allShapes: Array<[string, Record<string, unknown>]>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  deleteAllShapes: () => void;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const ProjectsPanel = ({ allShapes, fabricRef, deleteAllShapes, syncShapeInStorage }: Props) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => setProjects(json.projects ?? []))
      .catch(() => setProjects([]));
  };

  useEffect(refresh, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("Give the project a name first.");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    const canvasJson = allShapes.map(([, data]) => data);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, canvasJson }),
    });
    setIsSaving(false);
    if (res.ok) {
      setName("");
      setMessage("Saved.");
      refresh();
    } else {
      const body = await res.json().catch(() => null);
      setMessage(body?.error ?? "Failed to save project.");
    }
  };

  const handleLoad = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`);
    const json = await res.json();
    if (!res.ok || !json.project) {
      setMessage("Failed to load project.");
      return;
    }
    loadTemplateOntoCanvas({
      canvasJson: json.project.canvasJson,
      canvas: fabricRef,
      deleteAllShapes,
      syncShapeInStorage,
    });
  };

  const handleDelete = async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Save current canvas</h3>
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-ring"
        />
        <Button disabled={isSaving} onClick={handleSave} className="w-full">
          {isSaving ? "Saving…" : "Save as new project"}
        </Button>
        {message && <p className="text-xs text-accent">{message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Saved projects</h3>
        {projects.length === 0 && <p className="text-xs text-muted-foreground">Nothing saved yet.</p>}
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 rounded-sm border border-border p-2">
            <span className="truncate text-sm text-foreground">{p.name}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="border-border bg-background text-[10px] hover:border-accent hover:bg-background hover:text-accent"
                onClick={() => handleLoad(p.id)}
              >
                Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-border bg-background text-[10px] hover:border-destructive hover:bg-background hover:text-destructive"
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPanel;
