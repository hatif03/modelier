"use client";

import Image from "next/image";

type RecentVariant = {
  id: string;
  resultImageUrl: string;
  label: string;
};

type Props = {
  variants: RecentVariant[];
  onAddToCanvas: (url: string) => void;
};

// Past generations are only ever held in this panel's own component state —
// navigate away (or close the tab) and they're gone from view even though
// the render itself is still sitting in the database. This strip is the fix:
// a standing way back to anything already generated, without re-spending
// units to regenerate it. Rendered inside a collapsed-by-default accordion
// section by the parent panel — visibility is the parent's concern.
const RecentResultsStrip = ({ variants, onAddToCanvas }: Props) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {variants.map((v) => (
      <button
        key={v.id}
        title={`Add "${v.label}" to canvas`}
        onClick={() => onAddToCanvas(v.resultImageUrl)}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-border hover:border-accent"
      >
        <Image src={v.resultImageUrl} alt={v.label} fill unoptimized className="object-cover" />
      </button>
    ))}
  </div>
);

export default RecentResultsStrip;
