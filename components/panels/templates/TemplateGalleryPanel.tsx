"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";

import { loadTemplateOntoCanvas } from "@/lib/templates";

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

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((json) => setTemplates(json.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  const visible = format === "all" ? templates : templates.filter((t) => t.format === format);

  const handleUse = (template: Template) => {
    loadTemplateOntoCanvas({
      canvasJson: template.canvasJson,
      canvas: fabricRef,
      deleteAllShapes,
      syncShapeInStorage,
    });
  };

  return (
    <div className="flex flex-col">
      <TemplateFormatFilter active={format} onChange={setFormat} />
      <div className="grid grid-cols-2 gap-3 px-5 py-3">
        {visible.map((template) => (
          <TemplateCard key={template.id} template={template} onUse={handleUse} />
        ))}
      </div>
    </div>
  );
};

export default TemplateGalleryPanel;
