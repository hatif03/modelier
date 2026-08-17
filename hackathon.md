# Blush Riot — Devpost Submission

## Elevator pitch

> Blush Riot turns any small fashion or jewelry brand into a full creative studio — real 3D jewelry CAD, AI-powered photoshoots, and video ads, all from a phone's worth of product photos and Perfect Corp's YouCam API.

## Project story

### Inspiration

Independent jewelry and apparel sellers are shut out of the two things that actually move product online: professional photography and virtual try-on. A single-day studio shoot for a small apparel brand runs **\$1,000–\$5,000** just for the photographer, and a full campaign (models, styling, retouching) lands at **\$14,000–\$22,000** for maybe 30–60 finished images — [\$35–\$165 per photo](https://www.squareshot.com/post/clothing-brand-photoshoot-cost). Meanwhile **35% of jewelry retail is still independent** (down from 42% in 2020, per [IBISWorld](https://www.ibisworld.com/united-states/industry/jewelry-designers/6504/)) and losing ground to brands that *can* afford this kind of content. We wanted to know: what if the entire content pipeline — from CAD design to a finished Reel — used the same AI infrastructure the big players use, packaged for a one-person shop?

### What it does

Blush Riot (built on our platform, Modelier) is three studios in one dashboard:

- **Jewelry CAD Studio** — real parametric 3D design (Replicad/OpenCASCADE) for rings, necklaces, earrings, bracelets, and watches, exportable as manufacturing-ready STL/STEP files
- **AI Model Studio** — every YouCam capability we could integrate: apparel and jewelry virtual try-on across an inclusive cast of body types and skin tones, makeup VTO, hair/beard styling, skin and body retouching, avatar/headshot generation, and a full photo-editing suite (background removal, object removal, colorize, image extender)
- **Video Studio** — a browser-based WebCodecs timeline editor with AI auto-assembly, captions, color grading, and now (new this round) video enhancement, face swap, background replace, and style transfer

We used it, live, to build a complete fictional brand campaign end-to-end: 6 real CAD jewelry pieces, ~70 real AI generations, 14 finished marketing designs, and 2 video reels — all still sitting in the dashboard, nothing staged.

### How we built it

Next.js 14 + Prisma + Supabase, with fabric.js/Liveblocks for the canvas, Replicad/OpenCASCADE (WASM, in a Web Worker) for jewelry CAD, and WebCodecs for client-side video. YouCam integration is a hand-rolled TypeScript client (no SDK) against the raw S2S REST API — 52 endpoints wired up in total by the end of this session, each with its own request/response wrapper.

### Challenges we faced

Almost every challenge came from **PerfectCorp's own documentation not matching its live API** — and the only way to catch that was to actually run every endpoint for real, not just read the docs or type-check the code. Across this project we found and fixed **12 real, previously-shipped bugs**, including:

- Two endpoints (Fitzpatrick Skin Type, Nail VTO) silently missing a required top-level field the docs never flagged as load-bearing
- Face Swap's documented schema (`file_sets`/`actions`) turning out to belong to a *different* endpoint entirely — the real shape is a flat `ref_file_ids` array
- Face Analyzer's entire documented request schema being wrong; we only found the real one by sending a deliberately broken request and reading what the API's own error message said it wanted
- All four style-accessory endpoints (Shoes/Hat/Bag/Scarf) requiring a `gender` field the docs implied was shoes-only, and each having a *completely different* style-preset enum from the other three

The technical wall we hit hardest: AI-generated reference photos, however photorealistic to a human eye, sometimes carry subtle geometric asymmetry that trips PerfectCorp's stricter face-angle validators — a synthetic-face-vs-real-camera-photo gap that's invisible until you're running dozens of calls end-to-end.

## Built with

Next.js 14, TypeScript, Prisma, Supabase (Postgres + Storage), NextAuth, Liveblocks, fabric.js, Replicad + OpenCASCADE.js (WASM), Three.js, WebCodecs, `mediabunny`, Zustand + Zundo, Tailwind CSS, Radix UI, PerfectCorp YouCam S2S API, Anthropic/OpenAI/Gemini (assistant backends)

## What date did you start this project?

08-05-26


## Feature / value description

Blush Riot (built on Modelier) gives a solo jewelry or apparel seller a professional content pipeline that would otherwise cost thousands per shoot: parametric 3D jewelry design with manufacturing-ready exports, inclusive virtual try-on across skin tones and body types (VTO cuts return rates by [25–40%](https://www.getfocal.co/post/virtual-try-on-in-e-commerce-a-research-summary) and lifts conversion [20–40%](https://uwear.ai/solutions/increase-conversion-rate) industry-wide), and short-form video production for the channels where [46% of shoppers](https://autofaceless.ai/blog/social-commerce-statistics-2026) now say they discover what to buy.

## Repository

https://github.com/hatif03/modelier

## Demo video

https://youtu.be/1-rzN3CNLnA

A 3-minute walkthrough recorded live against the real demo account (see
README's "Demo account" section) — Jewelry CAD Studio, AI Model Studio (with
the specific YouCam endpoints named on camera), the canvas template drop-in,
and Video Studio, in that order. Shot-by-shot script and the reasoning behind
each beat: `DEMO_SCRIPT.md`.

## A moment the API surprised us

The Photo Enhance endpoint rejecting *every single call* until we noticed the docs never mentioned `scale` (1/2/4×) was required at all — it's not in the "required" list judges would see skimming the reference page, only in the full request schema. Small omission, total blocker, and a good reminder that "read the docs" and "call the API" are different levels of verification.

## Untapped use cases

Fine jewelry customization for engagement rings is the obvious one everyone's building for. Less obvious: **watch and eyewear resellers** (a near-identical VTO problem to jewelry, barely served), **bridal parties** (virtual try-on for an entire wedding party's outfits/jewelry in one coordinated session, not one shopper at a time), and **B2B wholesale catalogs** — a jewelry manufacturer generating VTO shots across dozens of skin tones for a retailer's website, instead of shipping physical samples for a photoshoot.

## Where we hit a wall

Fabric.js templates seed non-editable `Text` objects (their editable `IText` counterpart crashes on serialization) — so replacing placeholder copy meant scripting a full delete-and-recreate sequence via pixel-coordinate mouse events rather than a simple field edit, and getting that coordinate math right (accounting for a freshly-created text object's actual glyph position, not its click point) took several failed passes before it worked reliably across all 14 real projects.
