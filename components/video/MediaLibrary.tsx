"use client";

import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Upload } from "lucide-react";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { probeMedia } from "@/lib/video-engine/probe";
import { saveMediaFile, isStorageSupported } from "@/lib/video-engine/storage";
import type { MediaAsset } from "@/lib/video-engine/types";

const MediaLibrary = ({ projectId }: { projectId: string }) => {
  const storeApi = useTimelineStoreApi();
  // Select the raw map (a stable reference between renders) and derive the list in
  // the component body — a selector that allocates a new array every call (e.g.
  // `Object.values(...)` inline) defeats useSyncExternalStore's reference check and
  // causes an infinite render loop.
  const mediaMap = useTimelineStore((s) => s.media);
  const media = Object.values(mediaMap);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFiles = async (files: FileList) => {
    setIsImporting(true);
    for (const file of Array.from(files)) {
      try {
        const id = uuidv4();
        const probed = await probeMedia(file);
        await saveMediaFile(id, file);

        // Re-host to Supabase Storage for a permanent, cross-device URL — an
        // OPFS-only blob: URL only ever works back in the exact browser that
        // imported it, which breaks the moment anyone else (a judge on a
        // shared demo account, or the same person on a different device)
        // opens this project. Fall back to the session-local blob if the
        // upload fails, so import still works offline/without a hiccup.
        let url = URL.createObjectURL(file);
        try {
          const form = new FormData();
          form.set("file", file);
          form.set("mediaId", id);
          const res = await fetch(`/api/video-projects/${projectId}/media`, { method: "POST", body: form });
          if (res.ok) url = (await res.json()).url;
        } catch {
          // Keep the local blob: URL fallback set above.
        }

        const asset: MediaAsset = { id, url, ...probed };
        storeApi.getState().addMedia(asset);
      } catch (err) {
        console.error("Failed to import media", err);
      }
    }
    setIsImporting(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        className="flex flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:border-accent/60 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {isImporting ? "Importing…" : "Import video, audio, or images"}
      </button>
      {!isStorageSupported() && (
        <p className="text-[10px] text-muted-foreground">
          This browser can&apos;t persist media locally — imported files won&apos;t survive a reload.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {media.map((asset) => (
          <button
            key={asset.id}
            onClick={() => storeApi.getState().appendMediaClip(asset.id)}
            className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card text-left hover:border-accent/60"
            title="Add to timeline"
          >
            <div className="flex aspect-video items-center justify-center bg-muted/40">
              {asset.thumbnailUrl ? (
                // Data/blob URLs of arbitrary imported media — next/image's optimizer
                // can't (and shouldn't) proxy these, so a plain <img> is correct here.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.thumbnailUrl} alt={asset.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] uppercase text-muted-foreground">{asset.kind}</span>
              )}
            </div>
            <span className="truncate p-1.5 text-[10px] text-foreground">{asset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MediaLibrary;
