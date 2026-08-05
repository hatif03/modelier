"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getFormat } from "@/lib/formats";

type ProjectSummary = {
  id: string;
  name: string;
  format: string | null;
  width: number;
  height: number;
  updatedAt: string;
};

type Props = {
  query: string;
};

const ProjectGrid = ({ query }: Props) => {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => setProjects(json.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(refresh, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    refresh();
  };

  const visible = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Continue designing</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {projects.length === 0 ? "Nothing yet — create your first design above." : "No designs match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {visible.map((project) => {
            const format = getFormat(project.format);
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/design/${project.id}`)}
                className="group relative flex cursor-pointer flex-col justify-end overflow-hidden rounded-sm border border-border bg-card aspect-square p-3 hover:border-accent/60"
              >
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute right-2 top-2 hidden text-xs text-muted-foreground hover:text-destructive group-hover:block"
                  aria-label="Delete"
                >
                  ✕
                </button>
                <p className="truncate font-serif text-sm text-foreground">{project.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {format?.label ?? "Custom"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectGrid;
