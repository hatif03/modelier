"use client";

import { getFormat } from "@/lib/formats";
import RecentItemsGrid, { type RecentItem } from "@/components/shared/RecentItemsGrid";

type ProjectSummary = RecentItem & {
  format: string | null;
};

type Props = {
  query: string;
};

const ProjectGrid = ({ query }: Props) => (
  <RecentItemsGrid<ProjectSummary>
    title="Continue designing"
    emptyLabel="Nothing yet — create your first design above."
    fetchUrl="/api/projects"
    listKey="projects"
    query={query}
    itemHref={(project) => `/design/${project.id}`}
    deleteUrl={(id) => `/api/projects/${id}`}
    renamePatchUrl={(id) => `/api/projects/${id}`}
    renderMeta={(project) => (
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {getFormat(project.format)?.label ?? "Custom"}
      </p>
    )}
  />
);

export default ProjectGrid;
