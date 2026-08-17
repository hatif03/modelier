# Modelier — Demo Video Script

Target runtime: **3:00, hard cap.** Everything a judge needs to evaluate the
submission is shown by the 3:00 mark — nothing essential is held back for
later. If you choose to keep recording past it for a director's-cut version,
that's bonus material only; judges are never required to watch past 3:00 to
have seen the whole story.

Recorded live against the real `md.hatifosmani15@gmail.com` account (see
README's "Demo account" section), seeded with a fictional fine-jewelry/
ready-to-wear brand, **Blush Riot — The Undertone Edit**, so every screen
shows genuine, already-generated content — no placeholders, no mockups, no
slides standing in for the product.

**Filmed on the actual device Modelier is built for: a desktop/laptop browser
(Chrome recommended).** This isn't a mobile app — the canvas editor, the 3D
Jewelry CAD viewport, and the WebCodecs video timeline are all real-time,
pointer-and-keyboard, multi-panel tools designed for a real work session at a
desk, the same way Figma or Premiere are. The footage below should be a
straight screen recording of the live local app in a real browser window,
never a phone recording of a screen or a static screenshot deck — that's the
proof this is a working product, not a mockup.

Read each "SAY" line as a guide, not a script to recite word-for-word — say
it in your own words, just hit the same points.

---

## 0:00–0:12 — Cold open: the problem

**SHOW:** The real Dashboard (`/`), already logged in, full project grid
visible ("18 designs · 14 created this week").

**SAY:**
"A solo jewelry or apparel seller can't afford what a real product photoshoot
costs — one day with a photographer runs $1,000 to $5,000, a full campaign
with models and retouching runs $14,000 to $22,000. This is Modelier: three
studios in one dashboard that replace that entire pipeline, and I built a
real brand's worth of content in it to prove it."

---

## 0:12–0:45 — Jewelry CAD Studio: real parametric 3D, not a mockup

**SHOW:** Open a jewelry design (e.g. the Undertone Ring or the Riot Chain
Necklace). Drag a slider (band width, chain length) live and let the judges
watch the 3D model actually rebuild in the viewport. Point at **Export STL** /
**Export STEP**.

**SAY:**
"This is a real parametric CAD kernel — Replicad, running OpenCASCADE
compiled to WebAssembly, in a Web Worker — not a 3D viewer for a pre-made
model. Every slider rebuilds real solid geometry live, and it exports
manufacturing-ready STL and STEP files a jeweler could actually send to a
caster."

---

## 0:45–1:45 — AI Model Studio: the YouCam APIs, named

**SHOW:** Open the Blush Riot apparel project. AI Model Studio panel → Apparel
flow → upload a garment flat-lay → generate the 4-model diversity batch →
click into one result and point at its color-harmony note. Then a fast cut
through 2–3 more panels: Beauty/makeup VTO, Face & Hair analysis, and one
Photo Editing tool (e.g. Background Removal or Image Extender) run against a
real result.

**SAY:**
"One garment photo, one click, generates real on-model renders across four
different body types and skin tones at once — that's YouCam's **AI Clothes
Virtual Try-On**. This note comes from a real **AI Skin Tone Analysis** call,
matching the garment's color against each model's detected undertone. Same
pattern for beauty, with **AI Makeup Virtual Try-On**. And underneath all of
that sits a **Face Analyzer**, **Fitzpatrick Skin Type**, and hair-attribute
detection, plus a full photo-editing suite — background removal, object
removal, image extending, enhance — all real YouCam endpoints, all wired into
one dashboard instead of a dozen separate tools."

---

## 1:45–2:15 — Native template drop-in (the actual differentiation)

**SHOW:** Open a finished Blush Riot canvas Project (e.g. the Jewelry
Spotlight Instagram post) — the generated render already sitting inside the
template's placeholder, real brand type and colors around it. Click the
image layer to show it's a normal, editable object.

**SAY:**
"Here's what a standalone photo generator doesn't do: that render didn't need
exporting anywhere. It dropped straight into this template's placeholder, on
brand, as a normal editable layer I can resize or swap — same canvas, same
tool, no second app."

---

## 2:15–2:45 — Video Studio: the same photo becomes a video ad

**SHOW:** Open the Hero Reel video project. Show the timeline with three real
clips in place, hit Play so the judges see actual footage moving in the
preview, then point at the AI panel's video effects (Enhance, Style transfer,
Face swap, Background replace).

**SAY:**
"The same still becomes motion through YouCam's **Image-to-Video** API, and
from there it's a full browser-based timeline editor — WebCodecs, no upload
to a server to render — with auto-assembly, captions, and now video
enhancement, face swap, background replace, and style transfer, all running
against real footage, right here."

---

## 2:45–3:00 — Close: ethics and the pitch

**SHOW:** Back to the Dashboard, wide shot of the full project grid.

**SAY:**
"Every model in every one of these renders is fully AI-synthetic — never a
real person's photo or likeness — so a brand using this commercially never
has a consent problem. This is a professional content pipeline — CAD, photo,
and video — for the sellers who could never afford one before."

---

## Filming checklist

- [ ] Screen-recorded live on a real desktop/laptop browser — the actual
      device this app is built for — not a phone capture, not slides.
- [ ] Name these YouCam endpoints explicitly, on camera: **AI Clothes
      Virtual Try-On**, **AI Skin Tone Analysis**, **AI Makeup Virtual
      Try-On**, **Face Analyzer**, **Fitzpatrick Skin Type**, **Image-to-
      Video**, and at least one **Photo Editing** tool (Enhance, Background
      Removal, or Image Extender).
- [ ] Show the Jewelry CAD viewport actually rebuilding in response to a live
      slider change, not a static render.
- [ ] Show at least one color-harmony note on screen.
- [ ] Show at least one template drop-in — a generation sitting inside a
      branded template, not loose on a blank canvas.
- [ ] Show the Video Studio timeline actually playing back real footage.
- [ ] Mention synthetic/non-real reference models explicitly.
- [ ] Total runtime at or under 3:00 — everything above must be on screen by
      then; nothing essential held back for "later in the video."
