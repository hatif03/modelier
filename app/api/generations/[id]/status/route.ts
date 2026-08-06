import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClothesVtoStatus } from "@/lib/youcam/clothesVto";
import { getMakeupVtoStatus } from "@/lib/youcam/makeupVto";
import { getImageToVideoStatus } from "@/lib/youcam/imageToVideo";
import { getJewelryVtoStatus, jewelryFeatureToCategory } from "@/lib/youcam/jewelryVto";
import { friendlyYoucamError, friendlyJewelryError } from "@/lib/youcam/friendlyError";
import { computeHarmonyScore, computeJewelryHarmonyScore, classifyMetalTone, type Undertone } from "@/lib/colorHarmony";
import { rehostResultFile } from "@/lib/storage";

// The client polls this route every ~2s (see hooks/useInterval.ts). Each hit does
// ONE status check per still-processing variant against YouCam directly — no
// background poller, no queue. See PRD_MO~1.MD's async-flow requirement and the
// approved plan's rationale (adds at most one poll interval of latency, needs
// zero new infra).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const generation = await db.generation.findUnique({
    where: { id: params.id },
    include: { variants: { include: { referenceModel: true } } },
  });

  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }

  const processingVariants = generation.variants.filter((v) => v.status === "processing" && v.youcamTaskId);

  await Promise.all(
    processingVariants.map(async (variant) => {
      try {
        const jewelryCategory = jewelryFeatureToCategory(variant.youcamFeature);
        const result = jewelryCategory
          ? await getJewelryVtoStatus(jewelryCategory, variant.youcamTaskId as string)
          : variant.youcamFeature === "cloth-v3"
            ? await getClothesVtoStatus(variant.youcamTaskId as string)
            : variant.youcamFeature === "makeup-vto"
              ? await getMakeupVtoStatus(variant.youcamTaskId as string)
              : variant.youcamFeature === "image-to-video"
                ? await getImageToVideoStatus(variant.youcamTaskId as string)
                : null;

        if (!result || result.status === "running") return;

        if (result.status === "success") {
          const sourceUrl = (result.results as { url?: string } | undefined)?.url;
          let permanentUrl = sourceUrl;
          if (sourceUrl) {
            try {
              permanentUrl = await rehostResultFile(sourceUrl, `generations/${variant.id}`);
            } catch (rehostErr) {
              // Falls back to the ephemeral YouCam URL rather than losing the
              // result outright — it'll still work for the next ~2 hours.
              console.warn(`Failed to re-host result for variant ${variant.id}`, rehostErr);
            }
          }
          await db.generationVariant.update({
            where: { id: variant.id },
            data: { status: "success", resultImageUrl: permanentUrl },
          });
        } else {
          const rawError = result.errorMessage ?? result.error;
          await db.generationVariant.update({
            where: { id: variant.id },
            data: {
              status: "error",
              errorMessage: jewelryCategory ? friendlyJewelryError(rawError, jewelryCategory) : friendlyYoucamError(rawError),
            },
          });
        }
      } catch (err) {
        await db.generationVariant.update({
          where: { id: variant.id },
          data: {
            status: "error",
            errorMessage: err instanceof Error ? err.message : "Failed to check generation status.",
          },
        });
      }
    })
  );

  const refreshed = await db.generation.findUnique({
    where: { id: generation.id },
    include: { variants: { include: { referenceModel: true } } },
  });

  const stillProcessing = refreshed!.variants.some((v) => v.status === "processing");
  const anySuccess = refreshed!.variants.some((v) => v.status === "success");
  const overallStatus = stillProcessing
    ? "processing"
    : anySuccess
      ? refreshed!.variants.every((v) => v.status === "success")
        ? "success"
        : "partial"
      : "error";

  if (refreshed!.status !== overallStatus) {
    await db.generation.update({ where: { id: generation.id }, data: { status: overallStatus } });
  }

  // Score color harmony once, as soon as there's at least one successful
  // variant left un-scored — apparel and jewelry flows only (garmentColorHex is only
  // ever set on those), and only against the real, seed-time-detected undertone on
  // each ReferenceModel, never a live per-generation API call (see lib/colorHarmony.ts
  // for why). Jewelry reads garmentColorHex as a metal-tone hex instead of a garment
  // color — see classifyMetalTone.
  const unscored = refreshed!.variants.filter(
    (v) => v.status === "success" && v.colorHarmonyScore === null && v.referenceModel
  );
  if (refreshed!.garmentColorHex && unscored.length > 0) {
    const isJewelry = refreshed!.flow === "jewelry_vto";
    const metalTone = isJewelry ? classifyMetalTone(refreshed!.garmentColorHex as string) : null;
    const scored = unscored.map((variant) => ({
      variant,
      ...(metalTone
        ? computeJewelryHarmonyScore(metalTone, {
            label: variant.referenceModel!.label,
            undertone: variant.referenceModel!.undertone as Undertone,
          })
        : computeHarmonyScore(refreshed!.garmentColorHex as string, {
            label: variant.referenceModel!.label,
            undertone: variant.referenceModel!.undertone as Undertone,
          })),
    }));

    const successfulScored = refreshed!.variants
      .filter((v) => v.status === "success")
      .map((v) => scored.find((s) => s.variant.id === v.id) ?? { variant: v, score: v.colorHarmonyScore ?? 0 });
    const topScore = Math.max(...successfulScored.map((s) => s.score));

    await Promise.all(
      scored.map((s) =>
        db.generationVariant.update({
          where: { id: s.variant.id },
          data: {
            colorHarmonyScore: s.score,
            colorHarmonyNote: s.note,
            isBestMatch: s.score === topScore,
          },
        })
      )
    );

    const final = await db.generation.findUnique({
      where: { id: generation.id },
      include: { variants: { include: { referenceModel: true } } },
    });
    return NextResponse.json({ generation: { ...final, status: overallStatus } });
  }

  return NextResponse.json({ generation: { ...refreshed, status: overallStatus } });
}
