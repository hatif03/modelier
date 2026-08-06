"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import Image from "next/image";

import Dropzone from "@/components/ui/dropzone";
import { handleFileUpload, insertImageFromUrl } from "@/lib/shapes";
import { ICON_DEFS, insertIconOnCanvas } from "@/lib/icons";

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const ICON_FILL = "#211C19";

type LibraryItem = { id: string; url: string; label: string };

const UploadsPanel = ({ fabricRef, syncShapeInStorage }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const importShapeRef = useRef<fabric.Object | null>(null);

  // A general cross-project importer — rather than a one-off "drop into canvas"
  // action per generation, this pulls in anything the user has already made
  // elsewhere: saved Jewelry Studio designs and past AI Model Studio renders.
  useEffect(() => {
    Promise.all([
      fetch("/api/jewelry-designs").then((res) => res.json()).catch(() => ({ jewelryDesigns: [] })),
      fetch("/api/generations").then((res) => res.json()).catch(() => ({ generations: [] })),
    ])
      .then(([designsJson, generationsJson]) => {
        const designs: LibraryItem[] = (designsJson.jewelryDesigns ?? [])
          .filter((d: any) => d.renderedImageUrl)
          .map((d: any) => ({ id: `design-${d.id}`, url: d.renderedImageUrl, label: d.name }));

        const generations: LibraryItem[] = (generationsJson.generations ?? [])
          .flatMap((g: any) => g.variants ?? [])
          .filter((v: any) => v.status === "success" && v.resultImageUrl && v.youcamFeature !== "image-to-video")
          .map((v: any) => ({ id: `generation-${v.id}`, url: v.resultImageUrl, label: v.referenceModel?.label ?? "Render" }));

        setLibraryItems([...designs, ...generations].slice(0, 24));
      })
      .catch(() => setLibraryError("Couldn't load your library."));
  }, []);

  const handleSelected = (selected: File) => {
    setFile(selected);
    if (!fabricRef.current) return;
    handleFileUpload({ file: selected, canvas: fabricRef as any, syncShapeInStorage });
    // Cleared right away — this isn't a persisted attachment, just the
    // click-to-insert affordance, same intent as the toolbar's image button.
    setFile(null);
  };

  const handleImportFromLibrary = (url: string) => {
    if (!fabricRef.current) return;
    insertImageFromUrl({ url, canvas: fabricRef as any, shapeRef: importShapeRef, syncShapeInStorage }).catch(() =>
      setLibraryError("That image could no longer be loaded — it may be an old, expired result.")
    );
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Your images</h3>
        <Dropzone file={file} onFileSelected={handleSelected} label="PNG, JPG, or SVG" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">From your projects</h3>
        {libraryError && <p className="text-xs text-destructive">{libraryError}</p>}
        {libraryItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Jewelry Studio designs and past AI Model renders will show up here once you have some.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {libraryItems.map((item) => (
              <button
                key={item.id}
                title={item.label}
                onClick={() => handleImportFromLibrary(item.url)}
                className="relative aspect-square overflow-hidden rounded-sm border border-border hover:border-accent/60"
              >
                <Image src={item.url} alt={item.label} fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Icons</h3>
        <div className="grid grid-cols-4 gap-2">
          {ICON_DEFS.map((def) => (
            <button
              key={def.id}
              title={def.label}
              onClick={() => {
                if (!fabricRef.current) return;
                insertIconOnCanvas({ id: def.id, fill: ICON_FILL, canvas: fabricRef.current, syncShapeInStorage });
              }}
              className="flex aspect-square items-center justify-center rounded-sm border border-border p-2 hover:border-accent/60 hover:bg-accent/5"
            >
              <svg viewBox={def.viewBox} className="h-full w-full">
                <path d={def.path} fill="currentColor" className="text-foreground" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadsPanel;
