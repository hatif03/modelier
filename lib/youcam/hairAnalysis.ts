// AI Hair Density / Length / Type / Frizziness Detection — four DATA-only
// hair-attribute analyzers, no image output. Density and length each take one
// straight-on photo; type AND frizziness both require exactly 3 angle photos
// (front, right, left) sent together as src_file_urls/src_file_ids arrays,
// minItems 3 maxItems 3 — confirmed against the real OpenAPI YAML bundles
// (an earlier pass, using only the lower-fidelity `.md`-fetch trick, wrongly
// assumed frizziness was single-photo like density; that shipped as a real
// bug — every frizziness call failed with InvalidParameters until this was
// caught by actually running it). Building a dedicated 3-angle capture UI is
// out of scope for this pass, so v1 submits the same uploaded photo for all
// three slots for both type and frizziness — a documented simplification,
// not a silent one. Response is nested under the feature's own key (e.g.
// `results.hair_length.term`, `results.hair_frizziness.mapping/term`), not a
// flat {mapping, term} at the top level.
// Schema confirmed against https://docs.perfectcorp.com/_bundle/reference/
// {ai_hair_density_detection,ai_hair_length_detection,ai_hair_type_detection,
// ai_hair_frizziness_detection}.yaml
import { createTask, getTaskStatus, withSrcFile, type SrcFileInput } from "./client";

export type HairAttribute = "density" | "length" | "type" | "frizziness";

export const HAIR_ATTRIBUTE_FEATURE_SLUGS: Record<HairAttribute, string> = {
  density: "hair-density-detection",
  length: "hair-length-detection",
  type: "hair-type-detection",
  frizziness: "hair-frizziness-detection",
};

export type HairAttributeResult = { mapping?: string | number; term?: string };

const THREE_ANGLE_ATTRIBUTES: ReadonlySet<HairAttribute> = new Set(["type", "frizziness"]);

export async function createHairAttributeTask(attribute: HairAttribute, input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};

  if (THREE_ANGLE_ATTRIBUTES.has(attribute)) {
    // Three-angle requirement — see file header. Fan the single supplied
    // photo out to all three slots rather than asking for a new capture flow.
    if (input.srcFileId) payload.src_file_ids = [input.srcFileId, input.srcFileId, input.srcFileId];
    else if (input.srcFileUrl) payload.src_file_urls = [input.srcFileUrl, input.srcFileUrl, input.srcFileUrl];
    else throw new Error(`createHairAttributeTask(${attribute}) requires either srcFileId or srcFileUrl`);
  } else {
    withSrcFile(payload, input, `createHairAttributeTask(${attribute})`);
  }

  return createTask(HAIR_ATTRIBUTE_FEATURE_SLUGS[attribute], payload);
}

export async function getHairAttributeStatus(attribute: HairAttribute, taskId: string) {
  return getTaskStatus<HairAttributeResult>(HAIR_ATTRIBUTE_FEATURE_SLUGS[attribute], taskId);
}

export function hairAttributeFeatureToAttribute(feature: string): HairAttribute | undefined {
  return (
    (Object.entries(HAIR_ATTRIBUTE_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as HairAttribute | undefined) ??
    undefined
  );
}
