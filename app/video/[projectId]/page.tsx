import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// disable ssr — WebCodecs, OPFS, and canvas 2D all need a real browser, same reason
// app/jewelry/[designId]/page.tsx and app/design/[projectId]/page.tsx do this too.
const VideoEditor = dynamic(() => import("@/components/video/VideoEditor"), { ssr: false });

export default async function VideoProjectPage({ params }: { params: { projectId: string } }) {
  const session = await auth();

  const project = await db.videoProject.findUnique({ where: { id: params.projectId } });
  if (!project || project.userId !== session!.user.id) {
    notFound();
  }

  return (
    <VideoEditor
      project={{
        id: project.id,
        name: project.name,
        templateId: project.templateId,
        width: project.width,
        height: project.height,
        fps: project.fps,
        timelineJson: project.timelineJson,
      }}
    />
  );
}
