import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_RING_DESIGN } from "@/lib/jewelry/cad/schema/ring";
import { DEFAULT_NECKLACE_DESIGN } from "@/lib/jewelry/cad/schema/necklace";
import { DEFAULT_EARRING_DESIGNS, type EarringDesign } from "@/lib/jewelry/cad/schema/earring";
import { DEFAULT_BRACELET_DESIGNS, type BraceletDesign } from "@/lib/jewelry/cad/schema/bracelet";
import { DEFAULT_WATCH_DESIGN } from "@/lib/jewelry/cad/schema/watch";

const CATEGORIES = ["ring", "necklace", "earring", "bracelet", "watch"];
const METHODS = ["configurator", "sketch", "cad"];

// earring/bracelet need a sub-style at creation time (stud/hoop/dangle,
// chain/bangle/cuff) since those are structurally different feature trees, not
// parameter variations of one shape — see lib/jewelry/cad/schema/{earring,bracelet}.ts.
function defaultCadDesignJson(category: string, cadStyle: unknown) {
  switch (category) {
    case "ring":
      return DEFAULT_RING_DESIGN;
    case "necklace":
      return DEFAULT_NECKLACE_DESIGN;
    case "earring": {
      const style = (typeof cadStyle === "string" && cadStyle in DEFAULT_EARRING_DESIGNS ? cadStyle : "stud") as EarringDesign["style"];
      return DEFAULT_EARRING_DESIGNS[style];
    }
    case "bracelet": {
      const style = (typeof cadStyle === "string" && cadStyle in DEFAULT_BRACELET_DESIGNS ? cadStyle : "chain") as BraceletDesign["style"];
      return DEFAULT_BRACELET_DESIGNS[style];
    }
    case "watch":
      return DEFAULT_WATCH_DESIGN;
    default:
      // Unreachable once `category` has passed the CATEGORIES check above.
      return {};
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const jewelryDesigns = await db.jewelryDesign.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      method: true,
      renderedImageUrl: true,
      thumbnailUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ jewelryDesigns });
}

// Creates an empty design record — Jewelry Studio's editor is what actually fills in
// designJson/renderedImageUrl via PUT as the user works, same "create then edit" split
// app/api/projects/route.ts already uses for marketing-canvas projects.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, category, method, cadStyle } = await req.json();

  if (typeof category !== "string" || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of ${CATEGORIES.join(", ")}.` }, { status: 400 });
  }
  if (typeof method !== "string" || !METHODS.includes(method)) {
    return NextResponse.json({ error: `method must be one of ${METHODS.join(", ")}.` }, { status: 400 });
  }

  const jewelryDesign = await db.jewelryDesign.create({
    data: {
      userId: session.user.id,
      name: typeof name === "string" && name.trim() ? name.trim() : "Untitled design",
      category,
      method,
      designJson: method === "configurator" ? { partSelections: {} } : method === "cad" ? defaultCadDesignJson(category, cadStyle) : [],
    },
  });

  return NextResponse.json({ jewelryDesign }, { status: 201 });
}
