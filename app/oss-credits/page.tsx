import { AppHeader } from "@/components/shell/AppHeader";

// Jewelry Studio's 3D Studio (app/jewelry/[designId], method "cad") runs on
// OpenCASCADE Technology (OCCT) via WASM — a real CAD kernel, not vendored code we
// wrote ourselves. This page exists to satisfy that dependency's attribution
// obligations without gating the feature, scoped narrowly to what's actually used
// (same "narrow, honest" approach as this app's COOP/COEP header scoping).
const CREDITS = [
  {
    name: "Replicad",
    license: "MIT",
    role: "Parametric CAD API (sketch/extrude/revolve/boolean/export) used by 3D Studio.",
    url: "https://github.com/sgenoud/replicad",
  },
  {
    name: "OpenCascade.js / OpenCASCADE Technology (OCCT)",
    license: "LGPL-2.1 (OCCT itself under the Open CASCADE Technology Public License)",
    role: "The underlying WASM-compiled 3D solid-modeling kernel Replicad wraps.",
    url: "https://dev.opencascade.org/",
  },
  {
    name: "Three.js",
    license: "MIT",
    role: "WebGL rendering for the 3D Studio viewport.",
    url: "https://github.com/mrdoob/three.js",
  },
];

export default function OssCreditsPage() {
  return (
    <main className="min-h-screen bg-background">
      <AppHeader breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Open-source credits" }]} />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-8">
        <p className="text-sm text-muted-foreground">
          3D Studio (Jewelry Studio&apos;s real parametric CAD mode) is built on the following open-source projects.
        </p>
        <ul className="flex flex-col gap-4">
          {CREDITS.map((c) => (
            <li key={c.name} className="rounded-sm border border-border p-4">
              <a href={c.url} target="_blank" rel="noreferrer" className="font-serif text-lg text-foreground hover:text-accent">
                {c.name}
              </a>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{c.license}</p>
              <p className="mt-2 text-sm text-foreground">{c.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
