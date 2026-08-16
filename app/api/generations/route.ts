import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, YoucamApiError } from "@/lib/youcam/client";
import { createClothesVtoTask, type GarmentCategory } from "@/lib/youcam/clothesVto";
import { createMakeupVtoTask, lipColorEffectFromShade } from "@/lib/youcam/makeupVto";
import { createImageToVideoTask, type VideoResolution } from "@/lib/youcam/imageToVideo";
import { createTextToImageTask } from "@/lib/youcam/textToImage";
import {
  createJewelryVtoTask,
  POSE_BY_CATEGORY,
  JEWELRY_FEATURE_SLUGS,
  type JewelryCategory,
  type RingFinger,
} from "@/lib/youcam/jewelryVto";
import { friendlyJewelryError, friendlyYoucamError } from "@/lib/youcam/friendlyError";
import { createEffectTask, type EffectId } from "@/lib/youcam/effectDispatch";
import { createGenerativePortraitTask, GENERATIVE_PORTRAIT_FEATURE_SLUGS } from "@/lib/youcam/generativePortraits";
import { createVideoGeneratorTask } from "@/lib/youcam/video";
import type { AIStudioFlow } from "@/lib/ai-model-studio/types";
import { extractDominantColor } from "@/lib/colorHarmony";
import { computeOutpaintGeometry, ASPECT_RATIOS, type AspectRatioId } from "@/lib/youcam/outpaintGeometry";
import sharp from "sharp";

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
  const flow = form.get("flow") as AIStudioFlow | null;
  const garmentCategory = form.get("garmentCategory") as GarmentCategory | null;
  const jewelryCategory = form.get("jewelryCategory") as JewelryCategory | null;
  const ringFinger = form.get("ringFinger") as RingFinger | null;
  const ringWearingLocationRaw = form.get("ringWearingLocation");
  const ringWearingLocation = ringWearingLocationRaw ? Number(ringWearingLocationRaw) : undefined;
  const shadeHex = form.get("shadeHex");
  const referenceModelIds = form.getAll("referenceModelId").map(String);
  const projectId = form.get("projectId");
  // Alternative to `file` for the jewelry flow only — lets Jewelry Studio's "Preview on
  // a model" action pass its own already-hosted renderedImageUrl straight through as
  // the VTO ref photo, with no re-upload round trip.
  const refImageUrl = form.get("refImageUrl");

  if (
    flow !== "apparel_vto" &&
    flow !== "makeup_vto" &&
    flow !== "image_to_video" &&
    flow !== "jewelry_vto" &&
    flow !== "effect" &&
    flow !== "backdrop" &&
    flow !== "avatar_generator" &&
    flow !== "headshot_generator" &&
    flow !== "studio_generator"
  ) {
    return NextResponse.json(
      {
        error:
          "flow must be 'apparel_vto', 'makeup_vto', 'jewelry_vto', 'image_to_video', 'effect', 'backdrop', 'avatar_generator', 'headshot_generator', or 'studio_generator'.",
      },
      { status: 400 }
    );
  }

  // Avatar/Headshot/Studio Generator — a selfie in, a curated template
  // applied, N stylized portraits out. Same short-circuit shape as
  // "backdrop"/"effect" above: no ReferenceModel diversity concept.
  if (flow === "avatar_generator" || flow === "headshot_generator" || flow === "studio_generator") {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A selfie photo is required." }, { status: 400 });
    }
    const templateId = form.get("templateId");
    if (typeof templateId !== "string" || !templateId) {
      return NextResponse.json({ error: "Pick a style template." }, { status: 400 });
    }
    const outputCountRaw = form.get("outputCount");
    const outputCount = outputCountRaw ? Math.min(200, Math.max(1, Number(outputCountRaw))) : 1;
    const category = flow === "avatar_generator" ? "avatar" : flow === "headshot_generator" ? "headshot" : "studio";
    const feature = GENERATIVE_PORTRAIT_FEATURE_SLUGS[category];

    const generation = await db.generation.create({
      data: {
        userId: session.user.id,
        projectId: typeof projectId === "string" && projectId ? projectId : undefined,
        flow,
        status: "processing",
      },
    });

    let variant;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, { contentType: file.type || "image/jpeg", fileName: file.name || "selfie.jpg" });
      const taskId = await createGenerativePortraitTask(category, { srcFileId: uploaded.fileId, templateId, outputCount });
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamTaskId: taskId, youcamFeature: feature, status: "processing" },
      });
    } catch (err) {
      const errorMessage =
        err instanceof YoucamApiError
          ? friendlyYoucamError(err.errorCode)
          : err instanceof Error
            ? err.message
            : "Failed to start generation.";
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamFeature: feature, status: "error", errorMessage },
      });
    }

    await db.generation.update({
      where: { id: generation.id },
      data: { status: variant.status === "processing" ? "processing" : "error" },
    });

    return NextResponse.json({ generationId: generation.id, variants: [variant] }, { status: 201 });
  }

  // "backdrop" generates a scene from a prompt alone — no source photo, no
  // ReferenceModel diversity concept — same short-circuit shape as
  // image_to_video below.
  if (flow === "backdrop") {
    const prompt = form.get("prompt");
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Describe the scene you want to generate." }, { status: 400 });
    }

    const generation = await db.generation.create({
      data: {
        userId: session.user.id,
        projectId: typeof projectId === "string" && projectId ? projectId : undefined,
        flow,
        status: "processing",
      },
    });

    let variant;
    try {
      const taskId = await createTextToImageTask({ prompt: prompt.trim() });
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamTaskId: taskId, youcamFeature: "text-to-image/youcam", status: "processing" },
      });
    } catch (err) {
      const errorMessage =
        err instanceof YoucamApiError
          ? friendlyYoucamError(err.errorCode)
          : err instanceof Error
            ? err.message
            : "Failed to start backdrop generation.";
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamFeature: "text-to-image/youcam", status: "error", errorMessage },
      });
    }

    await db.generation.update({
      where: { id: generation.id },
      data: { status: variant.status === "processing" ? "processing" : "error" },
    });

    return NextResponse.json({ generationId: generation.id, variants: [variant] }, { status: 201 });
  }

  // "effect" covers every single-photo skin/face/body/hair/accessory effect
  // (see lib/youcam/effectDispatch.ts) — like image_to_video, it animates/
  // transforms one uploaded photo directly, with no ReferenceModel diversity
  // batch concept, so it's a short-circuit rather than threaded through the
  // reference-model loop below.
  if (flow === "effect") {
    const effectId = form.get("effectId") as EffectId | null;
    if (!effectId) {
      return NextResponse.json({ error: "effectId is required for the effect flow." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A source photo is required." }, { status: 400 });
    }

    let params: Record<string, unknown> = {};
    const paramsRaw = form.get("params");
    if (typeof paramsRaw === "string" && paramsRaw) {
      try {
        params = JSON.parse(paramsRaw);
      } catch {
        // Malformed params fall back to each effect's own defaults rather than failing the request.
      }
    }

    const generation = await db.generation.create({
      data: {
        userId: session.user.id,
        projectId: typeof projectId === "string" && projectId ? projectId : undefined,
        flow,
        status: "processing",
      },
    });

    let variant;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, {
        contentType: file.type || "image/jpeg",
        fileName: file.name || "upload.jpg",
      });

      let effectRefFileId: string | undefined;
      const refFile = form.get("refFile");
      if (refFile instanceof File) {
        const refBuffer = Buffer.from(await refFile.arrayBuffer());
        effectRefFileId = (
          await uploadFile(refBuffer, { contentType: refFile.type || "image/jpeg", fileName: refFile.name || "ref.jpg" })
        ).fileId;
      }

      let effectMskFileId: string | undefined;
      const maskFile = form.get("maskFile");
      if (maskFile instanceof File) {
        const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
        effectMskFileId = (
          await uploadFile(maskBuffer, { contentType: maskFile.type || "image/png", fileName: maskFile.name || "mask.png" })
        ).fileId;
      }

      // Image Extender needs the source photo's actual pixel dimensions to
      // compute its target-canvas placement params — the UI only exposes an
      // aspect-ratio choice, not raw width/height, so that math happens here
      // rather than asking the client to read image dimensions itself.
      if (effectId === "image_extender") {
        const { width, height } = await sharp(buffer).metadata();
        if (!width || !height) throw new Error("Couldn't read that photo's dimensions.");
        const aspectRatioId = (params.aspectRatio as AspectRatioId | undefined) ?? "4:5";
        if (!(aspectRatioId in ASPECT_RATIOS)) throw new Error(`Unknown aspect ratio: ${aspectRatioId}`);
        Object.assign(params, computeOutpaintGeometry(width, height, aspectRatioId));
      }

      const { taskId, feature } = await createEffectTask(
        effectId,
        { srcFileId: uploaded.fileId, refFileId: effectRefFileId, mskFileId: effectMskFileId },
        params
      );
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamTaskId: taskId, youcamFeature: feature, status: "processing" },
      });
    } catch (err) {
      const errorMessage =
        err instanceof YoucamApiError
          ? friendlyYoucamError(err.errorCode)
          : err instanceof Error
            ? err.message
            : "Failed to start generation.";
      variant = await db.generationVariant.create({
        data: { generationId: generation.id, youcamFeature: effectId, status: "error", errorMessage },
      });
    }

    await db.generation.update({
      where: { id: generation.id },
      data: { status: variant.status === "processing" ? "processing" : "error" },
    });

    return NextResponse.json({ generationId: generation.id, variants: [variant] }, { status: 201 });
  }

  // image_to_video animates a single arbitrary source image — no
  // ReferenceModel diversity concept applies, so it's handled as its own
  // short-circuit rather than threaded through the reference-model loop below.
  if (flow === "image_to_video") {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A source image is required." }, { status: 400 });
    }
    const videoMode = form.get("videoMode") === "template" ? "template" : "prompt";
    const prompt = form.get("prompt");
    const templateId = form.get("templateId");
    if (videoMode === "prompt" && (typeof prompt !== "string" || !prompt.trim())) {
      return NextResponse.json({ error: "Describe the motion you want in the clip." }, { status: 400 });
    }
    if (videoMode === "template" && (typeof templateId !== "string" || !templateId)) {
      return NextResponse.json({ error: "Pick a motion template." }, { status: 400 });
    }
    const resolution = (form.get("resolution") as VideoResolution | null) ?? "720";
    const durationSeconds = form.get("durationSeconds") === "10" ? 10 : 5;

    const generation = await db.generation.create({
      data: {
        userId: session.user.id,
        projectId: typeof projectId === "string" && projectId ? projectId : undefined,
        flow,
        status: "processing",
      },
    });

    let variant;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, {
        contentType: file.type || "image/png",
        fileName: file.name || "upload.png",
      });
      // "template" dispatches to the v1 AI Video Generator (createVideoGeneratorTask,
      // feature slug "image-to-video") instead of the already-live v2 prompt-based
      // generator (createImageToVideoTask, feature slug "image-to-video/youcam") —
      // same flow, two input styles, see VideoOptions.tsx's mode toggle.
      // Internal routing key only, not the literal YouCam feature slug (see
      // getEffectStatus's sibling dispatch in the status route) — the v1
      // template generator's real slug is ALSO literally "image-to-video",
      // same as the pre-existing v2 prompt generator's stored key, so this
      // flow needs its own distinct internal key ("image-to-video-v1") to
      // avoid the status route routing template-mode tasks to the prompt
      // getter (getImageToVideoStatus hits "image-to-video/youcam" for real).
      const feature = videoMode === "template" ? "image-to-video-v1" : "image-to-video";
      const taskId =
        videoMode === "template"
          ? await createVideoGeneratorTask({ srcFileId: uploaded.fileId, templateId: templateId as string, dstDuration: durationSeconds })
          : await createImageToVideoTask({
              srcFileId: uploaded.fileId,
              resolution,
              durationSeconds,
              prompt: (prompt as string).trim(),
            });
      variant = await db.generationVariant.create({
        data: {
          generationId: generation.id,
          youcamTaskId: taskId,
          youcamFeature: feature,
          status: "processing",
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof YoucamApiError
          ? friendlyYoucamError(err.errorCode)
          : err instanceof Error
            ? err.message
            : "Failed to start video generation.";
      variant = await db.generationVariant.create({
        data: {
          generationId: generation.id,
          youcamFeature: videoMode === "template" ? "image-to-video-v1" : "image-to-video",
          status: "error",
          errorMessage,
        },
      });
    }

    await db.generation.update({
      where: { id: generation.id },
      data: { status: variant.status === "processing" ? "processing" : "error" },
    });

    return NextResponse.json({ generationId: generation.id, variants: [variant] }, { status: 201 });
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
  if (flow === "jewelry_vto") {
    if (!jewelryCategory || !(jewelryCategory in POSE_BY_CATEGORY)) {
      return NextResponse.json(
        { error: "jewelryCategory must be one of ring, necklace, earring, bracelet, or watch." },
        { status: 400 }
      );
    }
    if (!(file instanceof File) && !(typeof refImageUrl === "string" && refImageUrl)) {
      return NextResponse.json(
        { error: "A jewelry product photo (upload, or refImageUrl) is required." },
        { status: 400 }
      );
    }
  }

  const referenceModels = await db.referenceModel.findMany({
    where: { id: { in: referenceModelIds }, isActive: true },
    include: { poses: true },
  });
  if (referenceModels.length !== referenceModelIds.length) {
    return NextResponse.json({ error: "One or more selected reference models were not found." }, { status: 400 });
  }

  let refFileId: string | undefined;
  let refFileUrl: string | undefined;
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

  if (flow === "jewelry_vto") {
    try {
      let buffer: Buffer;
      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadFile(buffer, {
          contentType: file.type || "image/jpeg",
          fileName: file.name || "upload.jpg",
        });
        refFileId = uploaded.fileId;
      } else {
        refFileUrl = refImageUrl as string;
        const res = await fetch(refFileUrl);
        if (!res.ok) throw new Error(`Failed to fetch refImageUrl (${res.status})`);
        buffer = Buffer.from(await res.arrayBuffer());
      }

      // Best-effort, same as apparel — feeds classifyMetalTone in the status route.
      try {
        garmentColorHex = (await extractDominantColor(buffer)).hex;
      } catch {
        garmentColorHex = undefined;
      }
    } catch {
      return NextResponse.json(
        { error: "We couldn't read that jewelry photo. Please upload a clear JPG or PNG under 10MB." },
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
      jewelryCategory: flow === "jewelry_vto" ? jewelryCategory : null,
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
              youcamFeature: "cloth-v4",
              status: "processing",
            },
            include: { referenceModel: true },
          });
        }

        if (flow === "jewelry_vto") {
          const category = jewelryCategory as JewelryCategory;
          const pose = POSE_BY_CATEGORY[category];
          let srcFileId: string | undefined;
          let srcFileUrl: string | undefined;

          if (pose) {
            const poseRow = model.poses.find((p) => p.pose === pose);
            if (!poseRow) {
              throw new Error(
                `No ${pose} close-up seeded for ${model.label} yet — run "npm run db:seed-reference-model-poses".`
              );
            }
            srcFileId = poseRow.youcamFileId ?? undefined;
            srcFileUrl = poseRow.youcamFileId ? undefined : poseRow.imageUrl;
          } else {
            srcFileId = model.youcamFileId ?? undefined;
            srcFileUrl = model.youcamFileId ? undefined : model.imageUrl;
          }

          const taskId = await createJewelryVtoTask(category, {
            srcFileId,
            srcFileUrl,
            refFileId,
            refFileUrl,
            ringFinger: ringFinger ?? undefined,
            ringWearingLocation,
          });
          return db.generationVariant.create({
            data: {
              generationId: generation.id,
              referenceModelId: model.id,
              youcamTaskId: taskId,
              youcamFeature: JEWELRY_FEATURE_SLUGS[category],
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
        const feature =
          flow === "apparel_vto"
            ? "cloth-v4"
            : flow === "jewelry_vto"
              ? JEWELRY_FEATURE_SLUGS[jewelryCategory as JewelryCategory]
              : "makeup-vto";
        // Upstream YouCam API errors carry a machine error code — route those through
        // the friendly-message maps instead of leaking raw API text (e.g. a bad feature
        // slug 404ing with `{"error": "This endpoint doesn't exist."}`) to the UI. Errors
        // we raised ourselves (validation, upload failures) already have a sensible
        // message and pass through unchanged.
        const errorMessage =
          err instanceof YoucamApiError
            ? flow === "jewelry_vto"
              ? friendlyJewelryError(err.errorCode, jewelryCategory as JewelryCategory)
              : friendlyYoucamError(err.errorCode)
            : err instanceof Error
              ? err.message
              : "Failed to start generation.";
        return db.generationVariant.create({
          data: {
            generationId: generation.id,
            referenceModelId: model.id,
            youcamFeature: feature,
            status: "error",
            errorMessage,
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
    include: { variants: { include: { referenceModel: true } } },
    take: 50,
  });

  return NextResponse.json({ generations });
}
