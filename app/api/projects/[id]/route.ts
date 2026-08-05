import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const name = body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "A non-empty name is required." }, { status: 400 });
  }

  const updated = await db.project.update({ where: { id: params.id }, data: { name: name.trim() } });
  return NextResponse.json({ project: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await db.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
