"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
  name: string;
  otherStyles?: string;
};

// A small, fixed palette in the app's own editorial tones — never a random
// stock photo of a stranger (the old behavior: a fresh
// liveblocks.io/avatars/avatar-N.png reassigned on every render).
const PALETTE = ["#FF2E7E", "#170014", "#FF8FC0", "#6B1740", "#0B0A0C", "#D6316E"];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsForName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const Avatar = ({ name, otherStyles }: Props) => (
  <Tooltip>
    <TooltipTrigger>
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-full font-serif text-xs text-white ${otherStyles}`}
        style={{ backgroundColor: colorForName(name) }}
        data-tooltip={name}
      >
        {initialsForName(name)}
      </div>
    </TooltipTrigger>
    <TooltipContent className="border border-border bg-card px-2.5 py-1.5 text-xs text-foreground">
      {name}
    </TooltipContent>
  </Tooltip>
);

export default Avatar;
