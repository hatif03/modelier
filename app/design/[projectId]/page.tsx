import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Room from "../../Room";

// disable ssr — fabric.js needs a real DOM canvas, can't be pre-rendered
const App = dynamic(() => import("../../App"), { ssr: false });

export default async function EditorPage({ params }: { params: { projectId: string } }) {
  const session = await auth();

  const project = await db.project.findUnique({
    where: { id: params.projectId },
    include: { template: true },
  });
  if (!project || project.userId !== session!.user.id) {
    notFound();
  }

  // Only relevant the very first time this room connects (see Room.tsx) — a
  // fresh objectId per object so using the same template twice never collides.
  const initialObjects = Array.isArray(project.template?.canvasJson)
    ? (project.template!.canvasJson as Record<string, unknown>[]).map((obj) => ({
        ...obj,
        objectId: uuidv4(),
      }))
    : undefined;

  return (
    <Room roomId={project.liveblocksRoomId} initialObjects={initialObjects}>
      <App width={project.width} height={project.height} projectId={project.id} initialName={project.name} />
    </Room>
  );
}
