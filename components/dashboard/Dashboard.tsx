"use client";

import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import QuickCreateTiles from "./QuickCreateTiles";
import ProjectGrid from "./ProjectGrid";

const Dashboard = () => {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader query={query} onQueryChange={setQuery} />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-8 py-8">
        <QuickCreateTiles query={query} />
        <ProjectGrid query={query} />
      </div>
    </main>
  );
};

export default Dashboard;
