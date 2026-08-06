"use client";

import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import QuickCreateTiles from "./QuickCreateTiles";
import ProjectGrid from "./ProjectGrid";

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [customSizeOpen, setCustomSizeOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader query={query} onQueryChange={setQuery} onCreateDesign={() => setCustomSizeOpen(true)} />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-8 py-8">
        <QuickCreateTiles query={query} customSizeOpen={customSizeOpen} onCustomSizeOpenChange={setCustomSizeOpen} />
        <ProjectGrid query={query} />
      </div>
    </main>
  );
};

export default Dashboard;
