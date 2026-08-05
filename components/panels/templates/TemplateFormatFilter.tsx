"use client";

const FORMATS = [
  { id: "all", label: "All" },
  { id: "instagram_post", label: "IG Post" },
  { id: "instagram_story", label: "IG Story" },
  { id: "product_listing", label: "Listing" },
];

type Props = {
  active: string;
  onChange: (format: string) => void;
};

const TemplateFormatFilter = ({ active, onChange }: Props) => (
  <div className="flex flex-wrap gap-2 px-5 py-3">
    {FORMATS.map((f) => (
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
