import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";

// Raw imported media (Media panel drag-and-drop) previously lived ONLY in
// OPFS + a session-scoped blob: URL — real for the browser that imported it,
// dead everywhere else (a different browser, a different device, or anyone
// else opening this project, e.g. a judge on the demo account). Re-hosting
// here gives every asset a permanent HTTPS URL that any browser can actually
// fetch, same as every other media type in this app already gets.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const videoProject = await db.videoProject.findUnique({ where: { id: params.id } });
  if (!videoProject || videoProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Video project not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const mediaId = form.get("mediaId");
  if (!(file instanceof File) || typeof mediaId !== "string" || !mediaId) {
    return NextResponse.json({ error: "A file and mediaId are required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const url = await uploadPublicFile(
    `video-project-media/${videoProject.id}/${mediaId}.${ext}`,
    buffer,
    file.type || "application/octet-stream"
  );

  return NextResponse.json({ url });
}
