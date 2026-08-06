import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const CATEGORIES = ["ring", "necklace", "earring", "bracelet", "watch"];
const METHODS = ["configurator", "sketch"];

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

  const { name, category, method } = await req.json();

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
      designJson: method === "configurator" ? { partSelections: {} } : [],
    },
  });

  return NextResponse.json({ jewelryDesign }, { status: 201 });
}
