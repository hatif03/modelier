"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Download, Redo2, Undo2 } from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { createTimelineStore } from "@/lib/video-engine/store";
import { TimelineStoreContext } from "@/lib/video-engine/context";
import type { MediaAsset, TimelineState } from "@/lib/video-engine/types";
import { exportTimeline, type ExportProgress } from "@/lib/video-engine/export";
import { probeMedia } from "@/lib/video-engine/probe";
import { saveMediaFile } from "@/lib/video-engine/storage";

import MediaLibrary from "./MediaLibrary";
import Inspector from "./Inspector";
import AIPanel from "./AIPanel";
import Preview from "./Preview";
import Timeline from "./Timeline";

type VideoProjectData = {
  id: string;
  name: string;
  templateId: string;
  width: number;
  height: number;
  fps: number;
  timelineJson: unknown;
};

const VideoEditor = ({ project }: { project: VideoProjectData }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(project.name);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const storeRef = useRef(createTimelineStore(project.templateId, project.width, project.height, project.fps));
  const dirtyRef = useRef(false);

  // A clip generated in AI Model Studio's image_to_video flow arrives here as a
  // remote URL (see AIModelStudioPanel.tsx's "Send to Video Studio" action) — fetch
  // it once, then treat it exactly like any other locally imported media from then
  // on (OPFS-persisted, no re-fetching), same "no uploads" model as a file import.
  useEffect(() => {
    const importUrl = searchParams.get("importUrl");
    if (!importUrl) return;
    router.replace(`/video/${project.id}`);

    (async () => {
      try {
        const res = await fetch(importUrl);
        const blob = await res.blob();
        const file = new File([blob], "ai-generated-clip.mp4", { type: blob.type || "video/mp4" });
        const id = uuidv4();
        const probed = await probeMedia(file);
        await saveMediaFile(id, file);
        const asset: MediaAsset = { id, url: URL.createObjectURL(file), ...probed };
        storeRef.current.getState().addMedia(asset);
        storeRef.current.getState().appendMediaClip(id);
        setStatusMessage("Imported the clip from AI Model Studio.");
      } catch {
        setStatusMessage("Couldn't import that clip — it may have expired.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timelineJson = project.timelineJson as Partial<TimelineState> | null;
    if (timelineJson && Array.isArray(timelineJson.tracks) && timelineJson.tracks.length > 0) {
      storeRef.current.getState().loadTimeline(timelineJson as TimelineState);
    }

    const unsubscribe = storeRef.current.subscribe(() => {
      dirtyRef.current = true;
    });

    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const state = storeRef.current.getState();
      await fetch(`/api/video-projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineJson: state.serialize() }),
      }).catch(() => {});
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRename = async () => {
    await fetch(`/api/video-projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => {});
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(null);
    try {
      const blob = await exportTimeline(storeRef.current.getState().serialize(), setExportProgress);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "video"}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Exported.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TimelineStoreContext.Provider value={storeRef.current}>
      <div className="flex h-screen flex-col bg-background">
        <AppHeader
          dense
          breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Video Studio", href: "/video" }]}
          trailing={
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              className="h-8 w-48 border-border bg-background text-sm"
            />
          }
          actions={
            <>
              <Button size="icon" variant="ghost" onClick={() => storeRef.current.temporal.getState().undo()} title="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => storeRef.current.temporal.getState().redo()} title="Redo">
                <Redo2 className="h-4 w-4" />
              </Button>
              {statusMessage && <span className="text-xs text-muted-foreground">{statusMessage}</span>}
              {isExporting && exportProgress && (
                <span className="text-xs text-muted-foreground">
                  {exportProgress.stage === "video"
                    ? `Rendering ${exportProgress.renderedFrames}/${exportProgress.totalFrames}…`
                    : exportProgress.stage === "audio"
                      ? "Mixing audio…"
                      : "Finalizing…"}
                </span>
              )}
              <Button size="sm" onClick={handleExport} disabled={isExporting}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {isExporting ? "Exporting…" : "Export"}
              </Button>
            </>
          }
        />

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 flex-none overflow-y-auto border-r border-border bg-card">
            <Tabs defaultValue="media" className="flex h-full flex-col">
              <TabsList className="mx-3 mt-3">
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="inspector">Inspector</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              <TabsContent value="media" className="flex-1 overflow-y-auto">
                <MediaLibrary />
              </TabsContent>
              <TabsContent value="inspector" className="flex-1 overflow-y-auto">
                <Inspector />
              </TabsContent>
              <TabsContent value="ai" className="flex-1 overflow-y-auto">
                <AIPanel />
              </TabsContent>
            </Tabs>
          </aside>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/90 p-4">
              <Preview />
            </div>
            <div className="h-56 flex-none border-t border-border bg-card">
              <Timeline />
            </div>
          </div>
        </div>
      </div>
    </TimelineStoreContext.Provider>
  );
};

export default VideoEditor;
