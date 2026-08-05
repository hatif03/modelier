/**
 * Smoke-test DB connectivity and seeded reference models when DATABASE_URL is set.
 * Run: npx tsx scripts/smoke-db.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set — add it to .env.local before running this.");
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    const models = await db.referenceModel.findMany({ where: { isActive: true }, orderBy: { id: "asc" } });
    console.log(`Active reference models: ${models.length}`);
    for (const m of models) {
      console.log(`  ${m.id} — ${m.label}`);
    }
    if (models.length < 4) {
      throw new Error("Expected at least 4 seeded reference models.");
    }
    console.log("Prisma smoke test OK.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
