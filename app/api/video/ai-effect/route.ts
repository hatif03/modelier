import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { YoucamApiError } from "@/lib/youcam/client";
import { friendlyYoucamError } from "@/lib/youcam/friendlyError";
import {
  uploadObjectRemovalVideoFile,
  createVideoGeneratorTask,
  createVideoEnhancerTask,
  createVideoFaceSwapTask,
  createVideoBackgroundReplaceTask,
  createVideoObjectRemovalTask,
  createVideoStyleTransferTask,
  VIDEO_EFFECT_FEATURE_SLUGS,
  type VideoEffectId,
} from "@/lib/youcam/video";
import { uploadFile } from "@/lib/youcam/client";

// Submits a real video clip (and, for some effects, a reference photo or a
// painted mask) to one of the six new Video Studio AI effects. Unlike
// /api/video/auto-assemble (metadata-only, talks to an LLM), this needs
// actual video bytes uploaded to YouCam — same multipart-upload shape as
// /api/generations' "effect" branch, just with no Generation/GenerationVariant
// row: Video Studio has no such model, the client (AIPanel.tsx) holds the
// returned {taskId, feature} in local state and polls the sibling status
// route directly, same as AIModelStudioPanel does for image effects.
const VIDEO_EFFECT_IDS = new Set<VideoEffectId>([
  "video_generator",
  "video_enhancer",
  "video_face_swap",
  "video_background_replace",
  "video_object_removal",
  "video_style_transfer",
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await req.formData();
  const effectId = form.get("effectId") as VideoEffectId | null;
  const file = form.get("file");

  if (!effectId || !VIDEO_EFFECT_IDS.has(effectId)) {
    return NextResponse.json({ error: "Unknown video effect." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A source video clip is required." }, { status: 400 });
  }

  let params: Record<string, unknown> = {};
  const paramsRaw = form.get("params");
  if (typeof paramsRaw === "string" && paramsRaw) {
    try {
      params = JSON.parse(paramsRaw);
    } catch {
      // Malformed params fall back to each effect's own defaults.
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Video Object Removal uploads through its own dedicated file endpoint
    // (see uploadObjectRemovalVideoFile) — every other effect uses the
    // shared one.
    const uploaded =
      effectId === "video_object_removal"
        ? await uploadObjectRemovalVideoFile(buffer, { contentType: file.type || "video/mp4", fileName: file.name || "clip.mp4" })
        : await uploadFile(buffer, { contentType: file.type || "video/mp4", fileName: file.name || "clip.mp4" });

    let refFileId: string | undefined;
    const refFile = form.get("refFile");
    if (refFile instanceof File) {
      const refBuffer = Buffer.from(await refFile.arrayBuffer());
      refFileId = (
        await uploadFile(refBuffer, { contentType: refFile.type || "image/jpeg", fileName: refFile.name || "ref.jpg" })
      ).fileId;
    }

    let mskFileId: string | undefined;
    const maskFile = form.get("maskFile");
    if (maskFile instanceof File) {
      const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
      mskFileId = (
        await uploadObjectRemovalVideoFile(maskBuffer, { contentType: maskFile.type || "image/png", fileName: maskFile.name || "mask.png" })
      ).fileId;
    }

    let taskId: string;
    switch (effectId) {
      case "video_generator":
        taskId = await createVideoGeneratorTask({
          srcFileId: uploaded.fileId,
          templateId: params.templateId as string,
          dstDuration: (params.dstDuration as 5 | 10) ?? 5,
          mode: params.mode as "std" | "pro" | undefined,
        });
        break;
      case "video_enhancer":
        taskId = await createVideoEnhancerTask({ srcFileId: uploaded.fileId, dstDuration: (params.dstDuration as number) ?? 5 });
        break;
      case "video_face_swap":
        if (!refFileId) throw new Error("video_face_swap requires a reference face photo");
        taskId = await createVideoFaceSwapTask({ srcFileId: uploaded.fileId, refFileId, dstDuration: (params.dstDuration as number) ?? 5 });
        break;
      case "video_background_replace":
        if (!refFileId) throw new Error("video_background_replace requires a reference background photo");
        taskId = await createVideoBackgroundReplaceTask({
          srcFileId: uploaded.fileId,
          refFileId,
          backgroundMode: params.backgroundMode as "crop" | "stretch" | undefined,
        });
        break;
      case "video_object_removal":
        if (!mskFileId) throw new Error("video_object_removal requires a painted mask");
        taskId = await createVideoObjectRemovalTask({ srcFileId: uploaded.fileId, mskFileId, frameIdx: (params.frameIdx as number) ?? 0 });
        break;
      case "video_style_transfer":
        taskId = await createVideoStyleTransferTask({ srcFileId: uploaded.fileId, templateId: params.templateId as string });
        break;
    }

    return NextResponse.json({ taskId, feature: VIDEO_EFFECT_FEATURE_SLUGS[effectId] }, { status: 201 });
  } catch (err) {
    const errorMessage =
      err instanceof YoucamApiError ? friendlyYoucamError(err.errorCode) : err instanceof Error ? err.message : "Failed to start the effect.";
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
