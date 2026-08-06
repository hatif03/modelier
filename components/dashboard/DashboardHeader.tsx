"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  onCreateDesign: () => void;
};

const DashboardHeader = ({ query, onQueryChange, onCreateDesign }: Props) => (
  <AppHeader
    breadcrumb={[{ label: "Modelier", href: "/" }]}
    search={
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search formats or your designs"
        className="input-ring max-w-xs border border-border bg-background"
      />
    }
    actions={
      <>
        <Link href="/jewelry" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          Jewelry Studio
        </Link>
        <Button size="sm" onClick={onCreateDesign}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create design
        </Button>
      </>
    }
  />
);

export default DashboardHeader;
