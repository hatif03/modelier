import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";

// Captured client-side on Save (canvas.toDataURL()) — same pattern as
// app/api/projects/[id]/thumbnail/route.ts, but here the rendered image doubles as both
// the design's thumbnail AND the actual product-shot photo fed to jewelry VTO as the
// ref image (Part A6 of the plan) and inserted into the marketing canvas as an asset.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const jewelryDesign = await db.jewelryDesign.findUnique({ where: { id: params.id } });
  if (!jewelryDesign || jewelryDesign.userId !== session.user.id) {
    return NextResponse.json({ error: "Design not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A rendered image is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const renderedImageUrl = await uploadPublicFile(
    `jewelry-designs/${jewelryDesign.id}.png`,
    buffer,
    file.type || "image/png"
  );

  await db.jewelryDesign.update({
    where: { id: jewelryDesign.id },
    data: { renderedImageUrl, thumbnailUrl: renderedImageUrl },
  });

  return NextResponse.json({ renderedImageUrl });
}
