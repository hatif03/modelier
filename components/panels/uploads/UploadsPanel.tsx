"use client";

import { useState } from "react";
import { fabric } from "fabric";

import Dropzone from "@/components/ui/dropzone";
import { handleFileUpload } from "@/lib/shapes";
import { ICON_DEFS, insertIconOnCanvas } from "@/lib/icons";

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const ICON_FILL = "#211C19";

const UploadsPanel = ({ fabricRef, syncShapeInStorage }: Props) => {
  const [file, setFile] = useState<File | null>(null);

  const handleSelected = (selected: File) => {
    setFile(selected);
    if (!fabricRef.current) return;
    handleFileUpload({ file: selected, canvas: fabricRef as any, syncShapeInStorage });
    // Cleared right away — this isn't a persisted attachment, just the
    // click-to-insert affordance, same intent as the toolbar's image button.
    setFile(null);
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Your images</h3>
        <Dropzone file={file} onFileSelected={handleSelected} label="PNG, JPG, or SVG" />
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
