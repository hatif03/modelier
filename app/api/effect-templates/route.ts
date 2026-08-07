import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listTemplates } from "@/lib/youcam/client";

// Feature slugs an EffectTemplateControl is allowed to request — an allowlist
// rather than forwarding whatever ?feature= a client sends straight to the
// YouCam API, since this route has no other validation on that value.
const ALLOWED_FEATURES = new Set(["hair-transfer", "hair-ext", "hair-vol", "hair-bang", "hair-curl", "beard-style", "fabric"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const feature = new URL(req.url).searchParams.get("feature");
  if (!feature || !ALLOWED_FEATURES.has(feature)) {
    return NextResponse.json({ error: "Unknown or missing template feature." }, { status: 400 });
  }

  try {
    const templates = await listTemplates(feature);
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Couldn't load templates for this effect right now." }, { status: 502 });
  }
}
