"use client";

import RecentItemsGrid, { type RecentItem } from "@/components/shared/RecentItemsGrid";
import { getVideoTemplate } from "@/lib/video/templates";

type VideoProjectSummary = RecentItem & { templateId: string };

const VideoProjectGrid = () => (
  <RecentItemsGrid<VideoProjectSummary>
    title="Your videos"
    emptyLabel="Nothing yet — pick a template above to start editing."
    fetchUrl="/api/video-projects"
    listKey="videoProjects"
    itemHref={(project) => `/video/${project.id}`}
    deleteUrl={(id) => `/api/video-projects/${id}`}
    renamePatchUrl={(id) => `/api/video-projects/${id}`}
    renameMethod="PUT"
    renderMeta={(project) => (
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {getVideoTemplate(project.templateId)?.label ?? project.templateId}
      </p>
    )}
  />
);

export default VideoProjectGrid;
