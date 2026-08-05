"use client";

const PRESET_SHADES = ["#C2185B", "#A13D3D", "#8B4049", "#B5651D", "#C97B63"];

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

const BeautyShadeSelector = ({ value, onChange }: Props) => (
  <div className="flex flex-col gap-2 px-5 py-3">
    <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Lip shade</h3>
    <div className="flex items-center gap-2">
      {PRESET_SHADES.map((hex) => (
        <button
          key={hex}
          onClick={() => onChange(hex)}
          style={{ backgroundColor: hex }}
          aria-label={hex}
          className={`h-7 w-7 rounded-full border ${value === hex ? "border-2 border-accent" : "border-border"}`}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded-full border border-border bg-transparent"
      />
    </div>
  </div>
);

export default BeautyShadeSelector;
