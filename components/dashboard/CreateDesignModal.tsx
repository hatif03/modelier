"use client";

import { motion } from "framer-motion";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORMATS } from "@/lib/formats";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  onCreateProject: (body: Record<string, unknown>) => void;
};

// Just the format-ratio picker — "Edit a video", "Custom size", and "Design
// jewelry" are their own direct entry points in QuickActionsRow.tsx now,
// since none of them are "pick an aspect ratio" the way a post format is.
const CreateDesignModal = ({ open, onOpenChange, isCreating, onCreateProject }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl rounded-xl">
      <DialogHeader>
        <DialogTitle>Choose a format</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {FORMATS.map((format, index) => {
          const Icon = format.icon;
          return (
            <motion.button
              key={format.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              disabled={isCreating}
              onClick={() => onCreateProject({ format: format.id })}
              className="glass-card hover-lift flex flex-col items-center gap-2 rounded-lg p-4 text-center hover:border-accent/60 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-foreground">{format.label}</span>
              <span className="text-[10px] text-muted-foreground">{format.aspectLabel}</span>
            </motion.button>
          );
        })}
      </div>
    </DialogContent>
  </Dialog>
);

export default CreateDesignModal;
