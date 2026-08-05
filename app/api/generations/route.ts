import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/youcam/client";
import { createClothesVtoTask, type GarmentCategory } from "@/lib/youcam/clothesVto";
import { createMakeupVtoTask, lipColorEffectFromShade } from "@/lib/youcam/makeupVto";
import { extractDominantColor } from "@/lib/colorHarmony";

// Diversity batches multiply YouCam unit spend 1:1 with variant count — this cap
// protects the free unit allotment from a single runaway request.
const MAX_DIVERSITY_BATCH = 4;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const flow = form.get("flow");
  const garmentCategory = form.get("garmentCategory") as GarmentCategory | null;
  const shadeHex = form.get("shadeHex");
  const referenceModelIds = form.getAll("referenceModelId").map(String);
  const projectId = form.get("projectId");

  if (flow !== "apparel_vto" && flow !== "makeup_vto") {
    return NextResponse.json({ error: "flow must be 'apparel_vto' or 'makeup_vto'." }, { status: 400 });
  }
  if (referenceModelIds.length === 0) {
    return NextResponse.json({ error: "At least one referenceModelId is required." }, { status: 400 });
  }
  if (referenceModelIds.length > MAX_DIVERSITY_BATCH) {
    return NextResponse.json(
      { error: `A single generation can request at most ${MAX_DIVERSITY_BATCH} variants.` },
      { status: 400 }
    );
  }
  if (flow === "apparel_vto") {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A product photo file is required." }, { status: 400 });
    }
    if (!garmentCategory) {
      return NextResponse.json({ error: "garmentCategory is required for the apparel flow." }, { status: 400 });
    }
  }
  if (flow === "makeup_vto" && (typeof shadeHex !== "string" || !HEX_COLOR.test(shadeHex))) {
    return NextResponse.json({ error: "A valid shadeHex (e.g. #C2185B) is required for the beauty flow." }, { status: 400 });
  }

  const referenceModels = await db.referenceModel.findMany({
    where: { id: { in: referenceModelIds }, isActive: true },
  });
  if (referenceModels.length !== referenceModelIds.length) {
    return NextResponse.json({ error: "One or more selected reference models were not found." }, { status: 400 });
  }

  let refFileId: string | undefined;
  let garmentColorHex: string | undefined;

  if (flow === "apparel_vto") {
    try {
      const buffer = Buffer.from(await (file as File).arrayBuffer());
      const uploaded = await uploadFile(buffer, {
        contentType: (file as File).type || "image/jpeg",
        fileName: (file as File).name || "upload.jpg",
      });
      refFileId = uploaded.fileId;

      // Best-effort — a failed color extraction shouldn't block the actual
      // generation, it just means no color-harmony note gets attached later.
      try {
        garmentColorHex = (await extractDominantColor(buffer)).hex;
      } catch {
        garmentColorHex = undefined;
      }
    } catch {
      return NextResponse.json(
        { error: "We couldn't read that photo. Please upload a clear JPG or PNG under 10MB." },
        { status: 400 }
      );
    }
  }

  const generation = await db.generation.create({
    data: {
      userId: session.user.id,
      projectId: typeof projectId === "string" && projectId ? projectId : undefined,
      flow,
      garmentCategory: flow === "apparel_vto" ? garmentCategory : null,
      garmentColorHex,
      isDiversityBatch: referenceModels.length > 1,
      status: "processing",
    },
  });

  const variants = await Promise.all(
    referenceModels.map(async (model) => {
      try {
        if (flow === "apparel_vto") {
          const taskId = await createClothesVtoTask({
            srcFileId: model.youcamFileId ?? undefined,
            srcFileUrl: model.youcamFileId ? undefined : model.imageUrl,
            refFileId: refFileId as string,
            garmentCategory: garmentCategory as GarmentCategory,
            changeShoes: false,
          });
          return db.generationVariant.create({
            data: {
              generationId: generation.id,
              referenceModelId: model.id,
              youcamTaskId: taskId,
              youcamFeature: "cloth-v3",
              status: "processing",
            },
            include: { referenceModel: true },
          });
        }

        const taskId = await createMakeupVtoTask({
          srcFileId: model.youcamFileId ?? undefined,
          srcFileUrl: model.youcamFileId ? undefined : model.imageUrl,
          effects: [lipColorEffectFromShade(shadeHex as string)],
        });
        return db.generationVariant.create({
          data: {
            generationId: generation.id,
            referenceModelId: model.id,
            youcamTaskId: taskId,
            youcamFeature: "makeup-vto",
            status: "processing",
          },
          include: { referenceModel: true },
        });
      } catch (err) {
        return db.generationVariant.create({
          data: {
            generationId: generation.id,
            referenceModelId: model.id,
            youcamFeature: flow === "apparel_vto" ? "cloth-v3" : "makeup-vto",
            status: "error",
            errorMessage: err instanceof Error ? err.message : "Failed to start generation.",
          },
          include: { referenceModel: true },
        });
      }
    })
  );

  const anyStarted = variants.some((v) => v.status === "processing");
  await db.generation.update({
    where: { id: generation.id },
    data: { status: anyStarted ? "processing" : "error" },
  });

  return NextResponse.json({ generationId: generation.id, variants }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const generations = await db.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { variants: true },
    take: 50,
  });

  return NextResponse.json({ generations });
}
