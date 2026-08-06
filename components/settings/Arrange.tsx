"use client";

import { fabric } from "fabric";

import { alignmentOptions, directionOptions } from "@/constants";
import { bringElement, alignElement } from "@/lib/shapes";

type Props = {
  fabricRef: React.RefObject<fabric.Canvas | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const Arrange = ({ fabricRef, syncShapeInStorage }: Props) => (
  <div className="flex flex-col gap-3 border-b border-border px-5 py-3">
    <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Arrange</h3>

    <div className="grid grid-cols-6 gap-1.5">
      {alignmentOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => alignElement({ canvas: fabricRef.current as fabric.Canvas, alignment: value, syncShapeInStorage })}
          className="flex items-center justify-center rounded-sm border border-border p-1.5 text-muted-foreground hover:border-accent/60 hover:text-foreground"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-1.5">
      {directionOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          onClick={() => bringElement({ canvas: fabricRef.current as fabric.Canvas, direction: value, syncShapeInStorage })}
          className="flex items-center justify-center gap-1.5 rounded-sm border border-border p-1.5 text-[10px] uppercase tracking-wide text-muted-foreground hover:border-accent/60 hover:text-foreground"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  </div>
);

export default Arrange;
