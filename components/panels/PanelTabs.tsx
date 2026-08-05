"use client";

export type PanelTabId = "ai-studio" | "templates" | "brand-kit" | "uploads" | "layers";

// Projects moved out — that's the Dashboard's job now (browse/open/delete),
// not something you switch to from inside an already-open project.
const TABS: { id: PanelTabId; label: string }[] = [
  { id: "ai-studio", label: "AI Model" },
  { id: "templates", label: "Templates" },
  { id: "brand-kit", label: "Brand Kit" },
  { id: "uploads", label: "Uploads" },
  { id: "layers", label: "Layers" },
];

type Props = {
  active: PanelTabId;
  onChange: (tab: PanelTabId) => void;
};

const PanelTabs = ({ active, onChange }: Props) => (
  <div className="flex border-b border-border">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 border-b-2 px-1 py-3 text-center text-[9px] uppercase leading-tight tracking-wide ${
          active === tab.id
            ? "border-accent font-semibold text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default PanelTabs;
