import { makeCylinder } from "replicad";
import type { Shape3D } from "replicad";

import type { SettingSpec } from "../schema/shared";
import { buildGemstone, girdleOutline } from "./gemstones";

export type SettingResult = { mount: Shape3D; gem: Shape3D | null };

// Builds the setting (mount) and, if a gemstone is specified, the gem — both
// centered at local origin with the girdle plane at z=0, ready for the caller to
// `.translate()` into place on top of a band. `gemstone` is optional (plain/decorative
// settings, e.g. a watch bezel with no stone, reuse the same primitive).
export function buildSetting(setting: SettingSpec): SettingResult {
  const gemSpec = setting.gemstone;
  const gem = gemSpec ? buildGemstone(gemSpec.shape, gemSpec.widthMm, gemSpec.lengthMm, gemSpec.depthMm) : null;

  if (setting.type === "prong") {
    const prongRadius = gemSpec ? Math.max(gemSpec.widthMm, gemSpec.lengthMm) / 2 + setting.prongThicknessMm * 0.6 : 2;
    let mount: Shape3D | null = null;
    for (let i = 0; i < setting.prongCount; i++) {
      const angleRad = ((360 / setting.prongCount) * i * Math.PI) / 180;
      const x = prongRadius * Math.cos(angleRad);
      const y = prongRadius * Math.sin(angleRad);
      const prong = makeCylinder(setting.prongThicknessMm / 2, setting.prongHeightMm, [x, y, -setting.prongHeightMm * 0.2], [0, 0, 1]);
      mount = mount ? mount.fuse(prong) : prong;
    }
    return { mount: mount!, gem };
  }

  // Bezel: an extruded wall following the gem's own outline (so it works for any of
  // the 5 gem shapes uniformly) — outer outline minus a matching inner outline.
  const gemWidth = gemSpec?.widthMm ?? 5;
  const gemLength = gemSpec?.lengthMm ?? 5;
  const shape = gemSpec?.shape ?? "round";

  const outer = girdleOutline(shape, gemWidth + setting.bezelThicknessMm * 2, gemLength + setting.bezelThicknessMm * 2)
    .sketchOnPlane("XY", [0, 0, -setting.bezelHeightMm * 0.3]) as any;
  const inner = girdleOutline(shape, gemWidth, gemLength).sketchOnPlane("XY", [0, 0, -setting.bezelHeightMm * 0.3]) as any;

  const outerSolid = outer.extrude(setting.bezelHeightMm);
  const innerSolid = inner.extrude(setting.bezelHeightMm);
  const mount = outerSolid.cut(innerSolid);

  return { mount, gem };
}
