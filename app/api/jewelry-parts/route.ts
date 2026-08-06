import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Read-only catalog for the configurator — options are supplied via
// scripts/seed-jewelry-parts.ts (a separate content pipeline, not user-created), so
// this only needs auth, not ownership checks. Expected to be empty until a real part
// -asset manifest is seeded; the configurator UI must handle that gracefully.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const category = new URL(req.url).searchParams.get("category");

  const jewelryPartOptions = await db.jewelryPartOption.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ partType: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ jewelryPartOptions });
}
