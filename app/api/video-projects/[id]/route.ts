import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProject = await db.videoProject.findUnique({ where: { id: params.id } });
  if (!videoProject || videoProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Video project not found." }, { status: 404 });
  }

  return NextResponse.json({ videoProject });
}

// The editor's Save action — persists the serialized timeline (tracks/clips/media
// refs/transcripts) plus duration/thumbnail. Any subset of fields may be sent.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProject = await db.videoProject.findUnique({ where: { id: params.id } });
  if (!videoProject || videoProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Video project not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.timelineJson !== undefined) data.timelineJson = body.timelineJson;
  if (typeof body.durationMs === "number") data.durationMs = body.durationMs;
  if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl;

  const updated = await db.videoProject.update({ where: { id: params.id }, data });
  return NextResponse.json({ videoProject: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProject = await db.videoProject.findUnique({ where: { id: params.id } });
  if (!videoProject || videoProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Video project not found." }, { status: 404 });
  }

  await db.videoProject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
