"use client";

import { useEffect, useState } from "react";

type ProjectStub = { createdAt: string };

// A lightweight, read-only line — deliberately does its own fetch rather than
// sharing RecentItemsGrid's (used by both the main Dashboard and Jewelry
// Studio) to avoid reshaping that generic component's contract for one
// caller's stat line.
const StatsStrip = () => {
  const [counts, setCounts] = useState<{ total: number; thisWeek: number } | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        const projects: ProjectStub[] = json.projects ?? [];
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const thisWeek = projects.filter((p) => new Date(p.createdAt).getTime() >= weekAgo).length;
        setCounts({ total: projects.length, thisWeek });
      })
      .catch(() => setCounts(null));
  }, []);

  if (!counts || counts.total === 0) return null;

  return (
    <p className="text-glow text-center text-xs text-muted-foreground">
      {counts.total} {counts.total === 1 ? "design" : "designs"}
      {counts.thisWeek > 0 && ` · ${counts.thisWeek} created this week`}
    </p>
  );
};

export default StatsStrip;
