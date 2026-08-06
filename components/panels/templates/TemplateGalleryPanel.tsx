"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";

import { loadTemplateOntoCanvas } from "@/lib/templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import TemplateFormatFilter from "./TemplateFormatFilter";
import TemplateCard, { Template } from "./TemplateCard";

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  deleteAllShapes: () => void;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const TemplateGalleryPanel = ({ fabricRef, deleteAllShapes, syncShapeInStorage }: Props) => {
  const [format, setFormat] = useState("all");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((json) => setTemplates(json.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  const visible = format === "all" ? templates : templates.filter((t) => t.format === format);

  const applyTemplate = (template: Template) => {
    loadTemplateOntoCanvas({
      canvasJson: template.canvasJson,
      canvas: fabricRef,
      deleteAllShapes,
      syncShapeInStorage,
    });
  };

  // Only worth confirming when there's actually something on the canvas to
  // lose — an empty canvas can just take the template immediately.
  const handleUse = (template: Template) => {
    const hasExistingContent = (fabricRef.current?.getObjects().length ?? 0) > 0;
    if (hasExistingContent) {
      setPendingTemplate(template);
    } else {
      applyTemplate(template);
    }
  };

  return (
    <div className="flex flex-col">
      <TemplateFormatFilter active={format} onChange={setFormat} />
      <div className="grid grid-cols-2 gap-3 px-5 py-3">
        {visible.map((template) => (
          <TemplateCard key={template.id} template={template} onUse={handleUse} />
        ))}
      </div>

      <AlertDialog open={pendingTemplate !== null} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              Using &quot;{pendingTemplate?.name}&quot; clears everything currently on the canvas and replaces it with the
              template. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTemplate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTemplate) applyTemplate(pendingTemplate);
                setPendingTemplate(null);
              }}
            >
              Use template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateGalleryPanel;
