import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";

// Captured client-side from the Preview canvas a few seconds after each
// timeline edit (see Preview.tsx's debounced canvas.toDataURL() call) — the
// same "Dashboard shows a real preview instead of a blank tile" pattern
// app/api/projects/[id]/thumbnail/route.ts already established for canvas
// Projects. Video Studio never had this wired up before.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProject = await db.videoProject.findUnique({ where: { id: params.id } });
  if (!videoProject || videoProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Video project not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("thumbnail");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A thumbnail image is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const thumbnailUrl = await uploadPublicFile(
    `video-project-thumbnails/${videoProject.id}.png`,
    buffer,
    file.type || "image/png"
  );

  await db.videoProject.update({ where: { id: videoProject.id }, data: { thumbnailUrl } });
  return NextResponse.json({ thumbnailUrl });
}
