"use client";

import { AppHeader } from "@/components/shell/AppHeader";

import TemplatePicker from "./TemplatePicker";
import VideoProjectGrid from "./VideoProjectGrid";

const VideoDashboard = () => (
  <main className="min-h-screen bg-background">
    <AppHeader breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Video Studio" }]} />
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-8 py-8">
      <TemplatePicker />
      <VideoProjectGrid />
    </div>
  </main>
);

export default VideoDashboard;
