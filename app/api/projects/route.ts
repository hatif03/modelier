import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFormat } from "@/lib/formats";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, format: true, width: true, height: true, thumbnailUrl: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ projects });
}

// Creates a new project + its own Liveblocks room (roomId only — the room
// itself is created implicitly by the client SDK on first connection, see
// app/design/[projectId]/page.tsx). No more "save a JSON snapshot" — an open
// project's canvas is live in its room from here on.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, format, width, height, templateId } = await req.json();

  let resolvedWidth = typeof width === "number" ? width : undefined;
  let resolvedHeight = typeof height === "number" ? height : undefined;
  let resolvedFormat = typeof format === "string" ? format : undefined;

  if (typeof templateId === "string") {
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    resolvedFormat = resolvedFormat ?? template.format;
  }

  const knownFormat = getFormat(resolvedFormat);
  if (knownFormat) {
    resolvedWidth = resolvedWidth ?? knownFormat.width;
    resolvedHeight = resolvedHeight ?? knownFormat.height;
  }

  if (!resolvedWidth || !resolvedHeight) {
    return NextResponse.json({ error: "A canvas size is required." }, { status: 400 });
  }

  const id = uuidv4();
  const project = await db.project.create({
    data: {
      id,
      userId: session.user.id,
      name: typeof name === "string" && name.trim() ? name.trim() : "Untitled design",
      format: resolvedFormat,
      width: resolvedWidth,
      height: resolvedHeight,
      templateId: typeof templateId === "string" ? templateId : undefined,
      liveblocksRoomId: `project-room-${id}`,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
