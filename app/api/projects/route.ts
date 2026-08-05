import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, canvasJson } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "A project name is required." }, { status: 400 });
  }
  if (!Array.isArray(canvasJson)) {
    return NextResponse.json({ error: "canvasJson must be an array of canvas objects." }, { status: 400 });
  }

  const project = await db.project.create({
    data: { userId: session.user.id, name: name.trim(), canvasJson },
  });

  return NextResponse.json({ project }, { status: 201 });
}
