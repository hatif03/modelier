"use client";

import { FORMATS } from "@/lib/formats";

const OPTIONS = [{ id: "all", label: "All" }, ...FORMATS.map((f) => ({ id: f.id, label: f.label }))];

type Props = {
  active: string;
  onChange: (format: string) => void;
};

const TemplateFormatFilter = ({ active, onChange }: Props) => (
  <div className="flex flex-wrap gap-2 px-5 py-3">
    {OPTIONS.map((f) => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        className={`rounded-sm border px-3 py-1.5 text-xs ${
          active === f.id
            ? "border-accent bg-accent/10 font-semibold text-foreground"
            : "border-border text-muted-foreground hover:border-accent/60"
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);

export default TemplateFormatFilter;
