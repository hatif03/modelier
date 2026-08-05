import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClothesVtoStatus } from "@/lib/youcam/clothesVto";
import { getMakeupVtoStatus } from "@/lib/youcam/makeupVto";
import { getImageToVideoStatus } from "@/lib/youcam/imageToVideo";
import { friendlyYoucamError } from "@/lib/youcam/friendlyError";
import { computeHarmonyScore, type Undertone } from "@/lib/colorHarmony";

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
        const result =
          variant.youcamFeature === "cloth-v3"
            ? await getClothesVtoStatus(variant.youcamTaskId as string)
            : variant.youcamFeature === "makeup-vto"
              ? await getMakeupVtoStatus(variant.youcamTaskId as string)
              : variant.youcamFeature === "image-to-video"
                ? await getImageToVideoStatus(variant.youcamTaskId as string)
                : null;

        if (!result || result.status === "running") return;

        if (result.status === "success") {
          await db.generationVariant.update({
            where: { id: variant.id },
            data: { status: "success", resultImageUrl: result.results?.url },
          });
        } else {
          await db.generationVariant.update({
            where: { id: variant.id },
            data: { status: "error", errorMessage: friendlyYoucamError(result.errorMessage ?? result.error) },
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
  // variant left un-scored — apparel flow only (garmentColorHex is only ever
  // set on that flow), and only against the real, seed-time-detected undertone
  // on each ReferenceModel, never a live per-generation API call (see
  // lib/colorHarmony.ts for why).
  const unscored = refreshed!.variants.filter(
    (v) => v.status === "success" && v.colorHarmonyScore === null && v.referenceModel
  );
  if (refreshed!.garmentColorHex && unscored.length > 0) {
    const scored = unscored.map((variant) => ({
      variant,
      ...computeHarmonyScore(refreshed!.garmentColorHex as string, {
        label: variant.referenceModel!.label,
        undertone: variant.referenceModel!.undertone as Undertone,
      }),
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
