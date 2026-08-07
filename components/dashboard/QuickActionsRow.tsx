"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Image as ImageIcon, Video, Ruler, Gem, type LucideIcon } from "lucide-react";

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

type Props = {
  onPost: () => void;
  onVideo: () => void;
  onCustom: () => void;
  onJewelry: () => void;
};

// Canva-style icon row — a spread-out set of circular icon buttons with a
// label underneath, replacing the single centered "Create a design" button.
// Each is its own direct entry point rather than a menu of cards inside a
// dialog, except "Post" which still opens CreateDesignModal since "a post"
// isn't one fixed aspect ratio.
const QuickActionsRow = ({ onPost, onVideo, onCustom, onJewelry }: Props) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: rowRef });

  const handleHover = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    const icon = e.currentTarget.querySelector("svg");
    if (icon) gsap.to(icon, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" });
  });

  const actions: Action[] = [
    { id: "post", label: "Post", icon: ImageIcon, onSelect: onPost },
    { id: "video", label: "Video", icon: Video, onSelect: onVideo },
    { id: "custom", label: "Custom", icon: Ruler, onSelect: onCustom },
    { id: "jewelry", label: "Jewelry", icon: Gem, onSelect: onJewelry },
  ];

  return (
    <div ref={rowRef} className="flex gap-8">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onSelect}
            onMouseEnter={handleHover}
            className="dash-stagger-item flex flex-col items-center gap-2"
          >
            <span className="glass-card shadow-panel flex h-14 w-14 items-center justify-center rounded-full text-primary transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-popover">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-glow text-xs font-medium text-foreground">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionsRow;
