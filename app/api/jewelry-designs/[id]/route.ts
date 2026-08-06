import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const jewelryDesign = await db.jewelryDesign.findUnique({ where: { id: params.id } });
  if (!jewelryDesign || jewelryDesign.userId !== session.user.id) {
    return NextResponse.json({ error: "Design not found." }, { status: 404 });
  }

  return NextResponse.json({ jewelryDesign });
}

// The editor's Save action — persists designJson (configurator part selections, or
// the sketch canvas's fabric.js canvasJson array) plus the freshly rendered
// product-shot image and thumbnail. Any subset of fields may be sent.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const jewelryDesign = await db.jewelryDesign.findUnique({ where: { id: params.id } });
  if (!jewelryDesign || jewelryDesign.userId !== session.user.id) {
    return NextResponse.json({ error: "Design not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.designJson !== undefined) data.designJson = body.designJson;
  if (typeof body.renderedImageUrl === "string") data.renderedImageUrl = body.renderedImageUrl;
  if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl;
  // One-way only: a Configurator design with no seeded parts can bail out to
  // Sketch, but Sketch has no part-selection data to go back the other way.
  if (body.method === "sketch" && jewelryDesign.method === "configurator") {
    data.method = "sketch";
    data.designJson = [];
  }

  const updated = await db.jewelryDesign.update({ where: { id: params.id }, data });
  return NextResponse.json({ jewelryDesign: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const jewelryDesign = await db.jewelryDesign.findUnique({ where: { id: params.id } });
  if (!jewelryDesign || jewelryDesign.userId !== session.user.id) {
    return NextResponse.json({ error: "Design not found." }, { status: 404 });
  }

  await db.jewelryDesign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
