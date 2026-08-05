import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const format = new URL(req.url).searchParams.get("format");

  const templates = await db.template.findMany({
    where: format ? { format } : undefined,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ templates });
}
