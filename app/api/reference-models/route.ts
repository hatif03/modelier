import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const referenceModels = await db.referenceModel.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ referenceModels });
}
