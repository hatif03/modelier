"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FORMATS } from "@/lib/formats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  query: string;
};

const MAX_SILHOUETTE = 40;

const QuickCreateTiles = ({ query }: Props) => {
  const router = useRouter();
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState("500");
  const [customHeight, setCustomHeight] = useState("500");
  const [isCreating, setIsCreating] = useState(false);

  const visibleFormats = FORMATS.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));
  const showCustom = "custom size".includes(query.toLowerCase()) || query === "";

  const createProject = async (body: Record<string, unknown>) => {
    setIsCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/design/${json.project.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Create a design</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {visibleFormats.map((format) => {
          const ratio = format.width / format.height;
          const silhouetteWidth = ratio >= 1 ? MAX_SILHOUETTE : MAX_SILHOUETTE * ratio;
          const silhouetteHeight = ratio >= 1 ? MAX_SILHOUETTE / ratio : MAX_SILHOUETTE;

          return (
            <button
              key={format.id}
              disabled={isCreating}
              onClick={() => createProject({ format: format.id })}
              className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center">
                <div
                  className="border border-foreground/60"
                  style={{ width: silhouetteWidth, height: silhouetteHeight }}
                />
              </div>
              <span className="text-xs text-foreground">{format.label}</span>
              <span className="text-[10px] text-muted-foreground">{format.aspectLabel}</span>
            </button>
          );
        })}

        {showCustom && (
          <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-border bg-card p-4 text-center">
            {creatingCustom ? (
              <div className="flex w-full flex-col gap-2">
                <div className="flex gap-1">
                  <Input
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="input-ring text-center"
                    placeholder="W"
                  />
                  <Input
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="input-ring text-center"
                    placeholder="H"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={isCreating}
                  onClick={() =>
                    createProject({ format: "custom", width: Number(customWidth), height: Number(customHeight) })
                  }
                >
                  Create
                </Button>
              </div>
            ) : (
              <button onClick={() => setCreatingCustom(true)} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center text-2xl text-accent">+</div>
                <span className="text-xs text-foreground">Custom size</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickCreateTiles;
