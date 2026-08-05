"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import Image from "next/image";

import { insertImageFromUrl, modifyShape } from "@/lib/shapes";
import { Button } from "@/components/ui/button";

type BrandKit = {
  id: string;
  name: string;
  logoUrl: string | null;
  colors: { primary?: string; accent?: string; background?: string; text?: string } | null;
  fontDisplay: string | null;
  fontBody: string | null;
};

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const FONT_OPTIONS = ["Fraunces", "Work Sans", "Georgia", "Helvetica", "Times New Roman"];
const COLOR_KEYS = ["primary", "accent", "background", "text"] as const;

const BrandKitPanel = ({ fabricRef, shapeRef, activeObjectRef, syncShapeInStorage }: Props) => {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [name, setName] = useState("My Brand Kit");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [colors, setColors] = useState({ primary: "#211C19", accent: "#BF6E52", background: "#F7F2EA", text: "#211C19" });
  const [fontDisplay, setFontDisplay] = useState("Fraunces");
  const [fontBody, setFontBody] = useState("Work Sans");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brand-kit")
      .then((res) => res.json())
      .then((json) => {
        const kit = json.brandKit as BrandKit;
        setBrandKit(kit);
        if (kit.name) setName(kit.name);
        if (kit.colors) setColors((prev) => ({ ...prev, ...kit.colors }));
        if (kit.fontDisplay) setFontDisplay(kit.fontDisplay);
        if (kit.fontBody) setFontBody(kit.fontBody);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage(null);
    const form = new FormData();
    if (logoFile) form.set("logo", logoFile);
    form.set("name", name);
    form.set("colors", JSON.stringify(colors));
    form.set("fontDisplay", fontDisplay);
    form.set("fontBody", fontBody);

    const res = await fetch("/api/brand-kit", { method: "PUT", body: form });
    const json = await res.json();
    setIsSaving(false);
    if (res.ok) {
      setBrandKit(json.brandKit);
      setLogoFile(null);
      setSavedMessage("Saved.");
    }
  };

  const handleInsertLogo = () => {
    if (!brandKit?.logoUrl || !fabricRef.current) return;
    insertImageFromUrl({ url: brandKit.logoUrl, canvas: fabricRef as any, shapeRef, syncShapeInStorage }).catch(
      () => {}
    );
  };

  // Applies a saved brand value straight to whatever's currently selected on
  // the canvas — same modifyShape() the manual color/font controls in
  // RightSidebar already use, just fed a brand-kit value instead of a
  // picker's onChange.
  const applyToSelection = (property: string, value: string) => {
    if (!fabricRef.current) return;
    modifyShape({ canvas: fabricRef.current, property, value, activeObjectRef, syncShapeInStorage });
  };

  const logoPreviewUrl = logoFile ? URL.createObjectURL(logoFile) : brandKit?.logoUrl;

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Brand name</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-sm border border-border bg-background p-1.5 text-xs text-foreground"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Logo</h3>
        <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed border-border hover:border-accent/60">
          {logoPreviewUrl ? (
            <Image src={logoPreviewUrl} alt="Brand logo" fill unoptimized className="object-contain" />
          ) : (
            <span className="px-2 text-center text-[10px] text-muted-foreground">Upload logo</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {brandKit?.logoUrl && !logoFile && (
          <Button
            size="sm"
            variant="outline"
            className="w-fit border-border bg-background text-[11px] hover:border-accent hover:bg-background hover:text-accent"
            onClick={handleInsertLogo}
          >
            Insert onto canvas
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Colors</h3>
        <div className="flex gap-3">
          {COLOR_KEYS.map((key) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                className="h-8 w-8 cursor-pointer rounded-full border border-border bg-transparent"
              />
              <span className="text-[9px] uppercase text-muted-foreground">{key}</span>
              <button
                onClick={() => applyToSelection("fill", colors[key])}
                title="Apply to selection"
                className="text-[9px] uppercase tracking-wide text-accent hover:underline"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Fonts</h3>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <select
              value={fontDisplay}
              onChange={(e) => setFontDisplay(e.target.value)}
              className="rounded-sm border border-border bg-background p-1.5 text-xs text-foreground"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              onClick={() => applyToSelection("fontFamily", fontDisplay)}
              title="Apply to selection"
              className="text-[9px] uppercase tracking-wide text-accent hover:underline"
            >
              Apply
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <select
              value={fontBody}
              onChange={(e) => setFontBody(e.target.value)}
              className="rounded-sm border border-border bg-background p-1.5 text-xs text-foreground"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              onClick={() => applyToSelection("fontFamily", fontBody)}
              title="Apply to selection"
              className="text-[9px] uppercase tracking-wide text-accent hover:underline"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {savedMessage && <p className="text-xs text-accent">{savedMessage}</p>}

      <Button disabled={isSaving} onClick={handleSave} className="w-full">
        {isSaving ? "Saving…" : "Save brand kit"}
      </Button>
    </div>
  );
};

export default BrandKitPanel;
