"use client";

import { AppHeader } from "@/components/shell/AppHeader";
import UserMenu from "./UserMenu";

// Just the wordmark + account menu — search moved into the hero section
// (Dashboard.tsx), and "Create design"/the Jewelry Studio link already moved
// into the body in an earlier pass. The header stays pure navigation chrome.
const DashboardHeader = () => (
  <AppHeader className="text-glow" breadcrumb={[{ label: "Modelier", href: "/" }]} actions={<UserMenu />} />
);

export default DashboardHeader;
