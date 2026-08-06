"use client";

import { AppHeader } from "@/components/shell/AppHeader";

import NewDesignTiles from "./NewDesignTiles";
import JewelryDesignGrid from "./JewelryDesignGrid";

const JewelryDashboard = () => (
  <main className="min-h-screen bg-background">
    <AppHeader breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Jewelry Studio" }]} />
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-8 py-8">
      <NewDesignTiles />
      <JewelryDesignGrid />
    </div>
  </main>
);

export default JewelryDashboard;
