"use client";

import { Input } from "@/components/ui/input";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
};

const DashboardHeader = ({ query, onQueryChange }: Props) => (
  <header className="flex items-center justify-between border-b border-border px-8 py-5">
    <span className="font-serif text-lg tracking-tight text-foreground">Modelier</span>
    <Input
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search formats or your designs"
      className="input-ring max-w-xs border border-border"
    />
  </header>
);

export default DashboardHeader;
