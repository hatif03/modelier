"use client";

import { Minus, Plus, Maximize } from "lucide-react";

import { Button } from "./ui/button";

type Props = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const EditorZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: Props) => (
  <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-1 shadow-lg">
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onZoomOut} aria-label="Zoom out">
      <Minus className="h-3.5 w-3.5" />
    </Button>
    <button
      onClick={onReset}
      className="w-11 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground"
      aria-label="Reset zoom to 100%"
    >
      {Math.round(zoom * 100)}%
    </button>
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onZoomIn} aria-label="Zoom in">
      <Plus className="h-3.5 w-3.5" />
    </Button>
    <div className="mx-1 h-4 w-px bg-border" />
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset} aria-label="Fit to 100%">
      <Maximize className="h-3.5 w-3.5" />
    </Button>
  </div>
);

export default EditorZoomControls;
