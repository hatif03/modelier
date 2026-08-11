import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// disable ssr — fabric.js/WebGL need a real DOM canvas, can't be pre-rendered (same
// reason app/design/[projectId]/page.tsx dynamic-imports its own editor).
const JewelryEditor = dynamic(() => import("@/components/jewelry/JewelryEditor"), { ssr: false });
const CadEditor = dynamic(() => import("@/components/jewelry/cad/CadEditor"), { ssr: false });

export default async function JewelryDesignPage({ params }: { params: { designId: string } }) {
  const session = await auth();

  const design = await db.jewelryDesign.findUnique({ where: { id: params.designId } });
  if (!design || design.userId !== session!.user.id) {
    notFound();
  }

  if (design.method === "cad") {
    return (
      <CadEditor
        design={{
          id: design.id,
          name: design.name,
          category: design.category as any,
          method: "cad",
          designJson: design.designJson,
          renderedImageUrl: design.renderedImageUrl,
        }}
      />
    );
  }

  return (
    <JewelryEditor
      design={{
        id: design.id,
        name: design.name,
        category: design.category as any,
        method: design.method as "configurator" | "sketch",
        designJson: design.designJson,
        renderedImageUrl: design.renderedImageUrl,
      }}
    />
  );
}
