import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";

// Scoped to one brand kit per user (the realistic case for the small brands
// this app targets) rather than full multi-kit CRUD — the Prisma relation
// still allows more than one, this route just always operates on the
// default/first one.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let brandKit = await db.brandKit.findFirst({ where: { userId: session.user.id } });
  if (!brandKit) {
    brandKit = await db.brandKit.create({
      data: {
        userId: session.user.id,
        name: "My Brand Kit",
        colors: { primary: "#0B0A0C", accent: "#FF2E7E", background: "#FFFFFF", text: "#0B0A0C" },
        fontDisplay: "Fraunces",
        fontBody: "Work Sans",
        isDefault: true,
      },
    });
  }

  return NextResponse.json({ brandKit });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await req.formData();
  const logo = form.get("logo");
  const name = form.get("name");
  const colorsRaw = form.get("colors");
  const fontDisplay = form.get("fontDisplay");
  const fontBody = form.get("fontBody");

  let brandKit = await db.brandKit.findFirst({ where: { userId: session.user.id } });
  if (!brandKit) {
    brandKit = await db.brandKit.create({
      data: { userId: session.user.id, name: "My Brand Kit", colors: {}, isDefault: true },
    });
  }

  let logoUrl: string | undefined;
  if (logo instanceof File) {
    const buffer = Buffer.from(await logo.arrayBuffer());
    logoUrl = await uploadPublicFile(`brand-kit/${session.user.id}/logo.png`, buffer, logo.type || "image/png");
  }

  const updated = await db.brandKit.update({
    where: { id: brandKit.id },
    data: {
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      logoUrl: logoUrl ?? undefined,
      colors: typeof colorsRaw === "string" ? JSON.parse(colorsRaw) : undefined,
      fontDisplay: typeof fontDisplay === "string" ? fontDisplay : undefined,
      fontBody: typeof fontBody === "string" ? fontBody : undefined,
    },
  });

  return NextResponse.json({ brandKit: updated });
}
