import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVideoTemplate } from "@/lib/video/templates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProjects = await db.videoProject.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, templateId: true, width: true, height: true, thumbnailUrl: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ videoProjects });
}

// Creates an empty video project from a template — the editor is what fills in
// timelineJson as the user imports media and edits, same "create then edit" split
// app/api/projects/route.ts and app/api/jewelry-designs/route.ts already use.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, templateId } = await req.json();

  const template = getVideoTemplate(typeof templateId === "string" ? templateId : "general") ?? getVideoTemplate("general")!;

  const videoProject = await db.videoProject.create({
    data: {
      userId: session.user.id,
      name: typeof name === "string" && name.trim() ? name.trim() : "Untitled video",
      templateId: template.id,
      width: template.width,
      height: template.height,
      fps: template.fps,
    },
  });

  return NextResponse.json({ videoProject }, { status: 201 });
}
