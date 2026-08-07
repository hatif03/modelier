"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { colorForName, initialsForName } from "@/lib/avatarColor";

type Props = {
  name: string;
  otherStyles?: string;
};

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
