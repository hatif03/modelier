"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  onCreate: (width: number, height: number) => void;
  trigger?: React.ReactNode;
};

// Used to live inline, expanding a grid tile in place — which broke the
// quick-create grid's rhythm every time it was opened. A dialog keeps the
// grid stable regardless of whether this is open.
const CustomSizeDialog = ({ open, onOpenChange, isCreating, onCreate, trigger }: Props) => {
  const [width, setWidth] = useState("500");
  const [height, setHeight] = useState("500");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom size</DialogTitle>
          <DialogDescription>Set the exact width and height for your design.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="custom-width">Width</Label>
            <Input id="custom-width" value={width} onChange={(e) => setWidth(e.target.value)} className="input-ring" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="custom-height">Height</Label>
            <Input id="custom-height" value={height} onChange={(e) => setHeight(e.target.value)} className="input-ring" />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={isCreating} onClick={() => onCreate(Number(width), Number(height))}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSizeDialog;
