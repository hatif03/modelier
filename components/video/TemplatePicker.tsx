"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { VIDEO_TEMPLATES } from "@/lib/video/templates";

const TemplatePicker = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const startProject = async (templateId: string) => {
    setIsCreating(true);
    const res = await fetch("/api/video-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/video/${json.videoProject.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Start a new video</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {VIDEO_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              disabled={isCreating}
              onClick={() => startProject(template.id)}
              className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs text-foreground">{template.label}</span>
              <span className="text-[10px] text-muted-foreground">{template.aspectLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatePicker;
