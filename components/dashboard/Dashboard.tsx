"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import DashboardHeader from "./DashboardHeader";
import HeroSearchBar from "./HeroSearchBar";
import HalftoneFlower from "./HalftoneFlower";
import QuickActionsRow from "./QuickActionsRow";
import CreateDesignModal from "./CreateDesignModal";
import CustomSizeDialog from "./CustomSizeDialog";
import StatsStrip from "./StatsStrip";
import ProjectGrid from "./ProjectGrid";

const Dashboard = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);

  // Single shared create-project path — the format grid and the custom-size
  // dialog both call this instead of each keeping its own copy.
  // `redirectQuery` is what lets "Video" land the user directly in the
  // editor's Video flow.
  const createProject = async (body: Record<string, unknown>, redirectQuery?: string) => {
    setIsCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/design/${json.project.id}${redirectQuery ?? ""}`);
  };

  // One-shot entrance stagger on first paint — imperative sequencing across
  // otherwise-unrelated elements is GSAP's job here; Framer Motion (used
  // inside CreateDesignModal) handles the React-state-driven list transitions.
  useGSAP(
    () => {
      gsap.from(".dash-stagger-item", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: bodyRef }
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard-glow">
      <HalftoneFlower />

      <div className="relative z-10">
        <DashboardHeader />
        <div ref={bodyRef} className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-8 py-12">
          <div className="dash-stagger-item flex flex-col items-center gap-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-foreground">What will you design today?</h1>
            <HeroSearchBar value={query} onChange={setQuery} />
          </div>

          <div className="dash-stagger-item">
            <QuickActionsRow
              onPost={() => setCreateModalOpen(true)}
              onVideo={() => createProject({ format: "instagram_story" }, "?flow=image_to_video")}
              onCustom={() => setCustomSizeOpen(true)}
              onJewelry={() => router.push("/jewelry")}
            />
          </div>

          <div className="dash-stagger-item">
            <StatsStrip />
          </div>

          <div className="dash-stagger-item w-full">
            <ProjectGrid query={query} />
          </div>
        </div>
      </div>

      <CreateDesignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        isCreating={isCreating}
        onCreateProject={createProject}
      />
      <CustomSizeDialog
        open={customSizeOpen}
        onOpenChange={setCustomSizeOpen}
        isCreating={isCreating}
        onCreate={(width, height) => createProject({ format: "custom", width, height })}
      />
    </main>
  );
};

export default Dashboard;
