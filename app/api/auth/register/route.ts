import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "A valid email and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { email, passwordHash, name: typeof name === "string" ? name : undefined },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
