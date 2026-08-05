import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";

// Captured client-side a few seconds after each canvas edit (see App.tsx's
// debounced canvas.toDataURL() call) so the Dashboard can show a real
// preview of the design, Canva-style, instead of a blank tile.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("thumbnail");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A thumbnail image is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const thumbnailUrl = await uploadPublicFile(
    `project-thumbnails/${project.id}.png`,
    buffer,
    file.type || "image/png"
  );

  await db.project.update({ where: { id: project.id }, data: { thumbnailUrl } });
  return NextResponse.json({ thumbnailUrl });
}
