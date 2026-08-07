"use client";

import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// The Canva-style hero centerpiece — always visible now that it has a whole
// spacious section to itself, unlike the old header-chrome version that had
// to collapse to an icon to avoid crowding the wordmark.
const HeroSearchBar = ({ value, onChange }: Props) => (
  <div className="glass-card flex w-full max-w-xl items-center gap-3 rounded-pill px-5 py-3.5">
    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search your designs"
      className="no-ring w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
    />
  </div>
);

export default HeroSearchBar;
