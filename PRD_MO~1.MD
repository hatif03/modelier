# PRD: Modelier — A VTO-Native Design Canvas for Small Fashion & Beauty Brands

**Working title:** Modelier (alternates: CanvasModel, OnModel Studio, Vantage — not finalized)
**Owner:** Azim
**Status:** Draft v1 — pre-build
**Context:** Submission for the YouCam API Skin AI & Apparel VTO Hackathon (Perfect Corp / Devpost)
**Submission deadline:** August 17, 2026, 11:45am EDT
**Track:** Skin AI + Apparel VTO (combined track)
**Base:** Built on an existing full-featured Canva-clone codebase (templates, brand kits, multi-format canvas editor); this PRD scopes the "major update" layered on top, per hackathon rules explicitly permitting an update to prior work.

---

## Problem Statement

Small fashion and beauty brands, independent sellers, and resellers (Etsy, Shopify, Depop, print-on-demand shops) need a constant stream of on-model and on-skin marketing imagery — social posts, ads, listing photos — but can't afford recurring photoshoots with real, diverse models. AI photo generators built specifically for this problem already exist and are validated at real scale (Botika serves fashion brands including Forever 21 and Perry Ellis; Pebblely serves smaller sellers across beauty, jewelry, and general product photography). But every one of these tools is a single-purpose generator: the seller creates the on-model or on-product photo there, downloads it, and then has to rebuild the actual social post, ad, or listing graphic in a separate design tool — Canva, Photoshop, or similar. That hand-off costs time, breaks brand-kit consistency (fonts, colors, and layout aren't connected to the freshly generated image), and forces small teams to pay for and juggle two subscriptions to do one job.

The gap is not "can AI generate a model wearing this product" — that's proven and commoditized. The gap is that no design tool generates that content natively, inside the same canvas where the finished asset gets built.

---

## Goals

**User goals**
1. A small brand or seller can go from a flat product photo to a finished, on-brand social/ad/listing asset — with a real on-model or on-skin render — without leaving the design tool or exporting/importing between two products.
2. A single product photo can be rendered across multiple skin tones and body types in one action, so inclusive marketing doesn't require re-generating and re-importing one variant at a time.
3. The generated render behaves as a normal, editable canvas layer (resizable, recolorable background, droppable into any existing template placeholder) rather than a flat, final image the user can only place, not adjust.

**Product/hackathon goals**
4. Demonstrate genuine fusion of Skin AI and Apparel VTO into one creative decision (e.g., suggesting which skin-tone/model preset best complements a garment's color), satisfying the combined track and the "not a wrapper" judging bar.
5. Draw a clear, demonstrable line between this and existing single-purpose AI photo tools (Botika, Pebblely) by showing the two-tool workflow on camera and then showing the same result produced in one tool, in one flow.

---

## Non-Goals

- **Not competing on raw photorealism with dedicated studio-grade AI photography.** This is a content-velocity tool for everyday marketing assets, not a replacement for top-tier editorial campaign shoots.
- **Not a social publishing or scheduling platform.** No direct posting integrations, content calendars, or analytics dashboards in v1 — the output is a finished asset the user still downloads or exports through existing channels.
- **Not a print-on-demand fulfillment platform.** No order processing, supplier integration, or fulfillment logic. This produces marketing/listing imagery, not physical goods.
- **Not a full rebuild of the underlying design canvas.** The existing Canva-clone editor, templates, and brand-kit system are the foundation; this PRD scopes only the new AI-model-generation capability layered into it, not a re-architecture of the base product.
- **Not attempting every YouCam try-on category at launch.** Broad category support (bags, hats, scarves, jewelry) is a stated direction, but v1 should prioritize depth on one apparel flow and one beauty flow over shallow coverage of everything (see Risks).

---

## Competitive Landscape

| Product | What it does | What it doesn't do |
|---|---|---|
| **Botika** | Generates on-model fashion photos from flat lays at scale; used by real fashion brands (Forever 21, Perry Ellis, La Redoute) for cost/time savings and model diversity. | No design/template layer — output is a photo the brand still imports elsewhere to build the actual post or ad. |
| **Pebblely** | Bulk AI product photography across beauty, jewelry, and general e-commerce categories, with scene/background templates. One of its own customer testimonials explicitly contrasts it with Canva. | Same gap — a photo generator, not a design tool. No brand kit, no multi-format templates, no editable layers. |
| **Deep Agency** | AI model marketplace/studio concept, currently in flux (rebranding/closed beta). | Early-stage, unclear current positioning; same single-purpose-generator category. |

**Differentiation:** Modelier isn't a better photo generator — it's the missing integration between photo generation and the design tool sellers already use to turn that photo into a finished asset. The wedge is collapsing a two-tool, two-subscription workflow into one, with brand-kit consistency preserved automatically because the render lands directly inside the same tool that holds the brand's fonts, colors, and templates.

---

## Target Users

**Primary: Independent brand owner / solo seller** (Etsy, Shopify, small D2C fashion or beauty label). Produces their own marketing content, price-sensitive, currently either skips diverse/on-model imagery entirely or juggles a photo tool plus a separate design tool.

**Secondary: Social media manager or in-house marketer at a small brand.** Produces a high volume of recurring content (weekly posts, seasonal campaigns) and needs consistency across many assets, not just one-off images.

**Tertiary (not built for in v1): Small agency serving multiple brand clients.** Represented only as a rationale for future multi-workspace direction (P2), not an active persona for this build.

---

## User Stories

**Independent brand owner**
- As an independent seller, I want to upload a flat-lay or mannequin photo of my product and generate an on-model version directly inside my design canvas, so I don't need a separate photo-generation subscription or an export/import step.
- As an independent seller, I want to generate the same product across a small set of diverse skin tones and body types in one action, so my marketing reflects real customers without manually regenerating each variant.
- As an independent seller, I want the generated render to drop into my existing branded templates (my fonts, my colors, my layout) automatically, so my content stays visually consistent without manual rework.

**Social media manager**
- As a social media manager, I want to save a small set of "house" model looks so that a whole week's or season's content uses a consistent, recognizable visual identity rather than a different random model each time.
- As a social media manager, I want a combined suggestion of which model/skin-tone preset pairs best with a specific garment's color, so I'm not guessing at color harmony manually for every asset.

**Edge cases / error states**
- As a user, if my uploaded product photo is unclear or the category isn't recognized (e.g., not a supported apparel/beauty type), I want a specific message telling me what's wrong, not a silent failure or a low-quality forced render.
- As a user, I want to know where the reference "model" images in the tool come from and confirm they carry no real-person likeness or consent issues, so I'm not exposing my brand to legal risk by using this tool's output commercially.

---

## Requirements

### Must-Have (P0)

**AI Model canvas tool (apparel flow)**
- New tool/panel in the existing editor: user uploads a product photo, selects category (top, bottom, dress, or full outfit), the tool calls AI Clothes Virtual Try-On (and AI Fabric Virtual Try-On where relevant) against a reference model, and inserts the result as a standard, editable image layer in the canvas.
- *Acceptance criteria:*
  - [ ] Given a clear flat-lay or mannequin photo and a selected category, when generation runs, then a usable on-model render appears as a movable, resizable canvas layer within a reasonable wait time (target: under 20 seconds).
  - [ ] Given an unclear photo or unsupported category, when generation is attempted, then the user sees a specific explanation, not a generic error or a forced low-quality result.

**AI Model canvas tool (beauty flow)**
- Equivalent flow for a beauty/makeup product: user uploads a product photo or selects a shade, the tool calls AI Makeup Virtual Try-On against a reference face, and inserts the result as an editable layer.
- *Acceptance criteria:*
  - [ ] Given a supported beauty product type, when generation runs, then the render is inserted as an editable canvas layer alongside the same controls as the apparel flow.

**Diversity batch generation**
- One action generates the same product across a small preset set (e.g., 3–4) of different skin tones and/or body types, presented as selectable variants rather than one-at-a-time regeneration.
- *Acceptance criteria:*
  - [ ] Given a single product upload, when the user requests diverse variants, then multiple distinct renders are produced and presented for selection in one batch action.

**Skin + Apparel combined suggestion**
- For the apparel flow, surface a skin-tone/color-harmony signal (from AI Skin Analysis / Facial Color Tones Analyzer) alongside the generated render — e.g., flagging which of the generated diverse variants has the strongest color-harmony match — so the two APIs inform one creative decision rather than operating as two disconnected buttons.
- *Acceptance criteria:*
  - [ ] Given a batch of diverse variants, when results are shown, then at least one is annotated with a specific color-harmony note tying the garment's color to the model's detected skin tone.

**Native template integration**
- Generated renders are standard image layers: droppable into existing template placeholders, resizable, layered under/over brand-kit elements (logos, text, color blocks) exactly like any other image asset already supported by the base editor.
- *Acceptance criteria:*
  - [ ] Given a generated render, when dropped into an existing template placeholder, then it resizes and positions using the same interaction model as any other image in the editor, with no special-cased behavior visible to the user.

**Submission compliance**
- Public or shared-private repository with setup instructions.
- 1–3 minute demo video showing the full flow end-to-end, explicitly naming the YouCam APIs used, including a side-by-side moment showing the old two-tool workflow versus the new one-tool flow.
- Screenshots and a text description of consumer/retail value, per hackathon rules.

### Nice-to-Have (P1)

- Saved "brand model" presets so a brand's chosen look(s) persist and get reused across a content calendar rather than being re-selected each time.
- Scene/background generation paired with the on-model render (e.g., via AI Photo Background Change) so the full asset — not just the model — is produced in-tool.
- Support for additional YouCam try-on categories (bags, hats, scarves, jewelry) using the same panel and flow already built for apparel.
- Lightweight usage insight (which categories/templates are used most) to inform what to prioritize if this continues past the hackathon.

### Future Considerations (P2)

- Multi-brand / agency workspace management for teams serving several clients.
- Direct social publishing or scheduling integrations.
- Print-on-demand fulfillment integration.
- Marketplace listing image-spec compliance checks (Amazon/Etsy/Walmart size and content rules).
- Short-form AI video generation (via AI Video Generator) built from the same on-model renders.

---

## YouCam API Mapping

| Product need | YouCam API |
|---|---|
| On-model apparel render | AI Clothes Virtual Try-On, AI Fabric Virtual Try-On |
| Beauty/makeup product render | AI Makeup Virtual Try-On |
| Skin-tone/undertone signal for color-harmony suggestion | AI Skin Analysis, AI Facial Color Tones Analyzer |
| (P1) Additional accessory categories | AI Bag / AI Hat / AI Scarf / Jewelry Virtual Try-On APIs |
| (P1) Scene/background generation | AI Photo Background Change |

Apparel VTO and Skin AI are used together on the same creative decision (color-harmony suggestion across diverse variants), satisfying the combined track rather than treating them as unrelated features.

---

## Technical Architecture Overview

- **Foundation:** existing Canva-clone canvas editor, asset panel, template system, and brand-kit infrastructure — unchanged in this scope.
- **New capability:** an "AI Model Studio" panel added to the existing asset/tool sidebar, triggering a backend service that calls the relevant YouCam APIs server-side (API key never exposed client-side).
- **Generation flow:** upload → category selection → server-side API call(s) → polling/webhook for async result (VTO renders are not instantaneous) → returned image ingested into the existing image-asset pipeline as a normal layer object, not a special-cased element.
- **Reference model sourcing:** to avoid real-person likeness/consent issues entirely, reference "models" should be fully AI-synthetic faces/bodies rather than photographs of real people — this is a deliberate legal and ethical safeguard, not just a technical shortcut, and should be treated as a hard requirement, not an implementation detail.
- **Diversity presets:** a small, curated set of synthetic reference profiles (varied skin tone, body type) maintained by the product, not sourced from real individuals.

---

## Success Metrics

**Hackathon-specific**
- Judging criteria alignment: Technological Implementation (genuine multi-API fusion inside a real design tool, not a standalone demo), Design (coherent, complete product experience), Potential Impact (specific, credible small-brand audience and cost/time story), Quality of Idea (clear differentiation from existing AI photo generators).
- Demo proof points: a real product asset built start-to-finish inside the canvas; the two-tool-vs-one-tool comparison shown explicitly on camera; at least one combined skin+apparel suggestion shown working.

**If this continues past the hackathon**
- Leading indicators: time from signup to first generated-and-used asset, number of renders generated per active brand per week, % of generated renders actually placed into a finished, exported design (versus generated and discarded).
- Lagging indicators: self-reported time/cost savings versus prior workflow (survey), retention of brands using the AI Model Studio panel versus those who don't.
- No numeric targets are set yet — to be defined only if there's a real plan to operate this beyond the submission.

---

## Risks & Assumptions

- **Risk:** Judges may see surface-level overlap with Botika/Pebblely and read this as derivative if the "native to the design tool" differentiation isn't made explicit and visual in the demo. Mitigate by filming the two-tool workflow first, then the one-tool workflow, back to back.
- **Risk:** Full multi-category coverage (apparel, bags, hats, scarves, jewelry, beauty) is too much scope for the timeline. Mitigate by building one apparel flow and one beauty flow deeply for P0, and stating broader category support as an explicit, credible P1 direction rather than attempting shallow coverage of everything.
- **Risk:** Using real photographed people as reference "models" creates licensing/consent exposure for any brand using this commercially. Mitigate by committing to fully synthetic reference faces/bodies as a hard requirement, not an optional detail — and say so explicitly in the pitch, since it's also a legitimate differentiator against tools that may rely on real model photo libraries.
- **Risk:** Diversity batch generation multiplies API calls per action; the free 1,000-unit hackathon allotment may not stretch far in testing. Check actual per-call unit cost early and budget test volume accordingly.
- **Assumption:** The existing Canva-clone codebase is extensible enough to add a new generation panel and async job handling without a significant rebuild — this should be validated with a short technical spike in week one, not assumed.

---

## Open Questions

- **(Team — blocking)** Final product name.
- **(Engineering — blocking)** Is the existing Canva-clone codebase's architecture (asset pipeline, layer system) actually extensible enough for this in the available time? Needs a technical spike before committing to the full P0 scope.
- **(Team — blocking)** Which two categories (one apparel, one beauty) get built deeply for the demo, versus stated as future direction?
- **(Team — non-blocking)** Exact source/creation method for the synthetic reference model presets — generated in advance and stored, or generated on demand per session?
- **(Engineering — non-blocking)** Confirm actual YouCam API unit cost per call against the free allotment, especially given batch/diversity generation multiplies calls per action.

---

## Jewelry Vertical (post-hackathon direction)

Added after v1: a jewelry vertical, sequenced deliberately in two independent pieces
rather than one bolted-on feature.

**Jewelry Studio** — a standalone design tool (`/jewelry`, separate from the marketing
canvas editor entirely, no Liveblocks room, single-user), where a non-designer actually
designs a piece: a parts-based configurator (pick a band, stone, and metal finish from
preset swatches) or a simplified freeform 2D sketch tool with gem-outline shapes and
metal-color swatches. This is deliberately not a CAD tool. Real part-asset images are
sourced/supplied separately from this build — the configurator's catalog
(`JewelryPartOption`) is data-driven and starts empty until populated via
`scripts/seed-jewelry-parts.ts`.

**Jewelry VTO** (ring/necklace/earring/bracelet/watch virtual try-on) — kept
deliberately separate from design. It only runs when explicitly requested: from inside
Jewelry Studio ("Preview on a model," using the design's own rendered image as the
product photo) or from the marketing canvas's AI Model Studio panel, for a seller's own
real product photography — mirroring the existing apparel/beauty flows and extending the
skin-AI fusion story with a metal-tone × undertone harmony signal (gold/rose-gold suits
warm undertones, silver suits cool undertones).

**Target audience sequencing:** near-term ICP is the same as the rest of the
product — independent jewelry designers and Etsy/Shopify sellers who currently can't
afford a photoshoot with a live hand/ear/wrist model per SKU. Fine/high-jewelry brands
and boutiques are the stated growth direction once fidelity, customization, and
brand-kit polish catch up — the wedge toward becoming the first choice for businesses in
the high fashion market, not the opening move.

**Explicitly deferred, not dropped:** a 3D preview capability was considered (an
agent-orchestrated procedural-geometry pipeline was evaluated) but is out of scope for
this build — it's a multi-stage, multi-LLM-call process with no simple hosted-API
equivalent, not a fast per-request feature. Real R&D into a viable 3D approach is a
named future direction, not a silently abandoned idea.

## Timeline Considerations

- **Hard deadline:** August 17, 2026, 11:45am EDT. Today is August 3, 2026 — roughly two weeks.
- **Suggested phasing:**
  - **Week 1:** Technical spike on the existing codebase's extensibility; finalize synthetic reference-model sourcing approach; build the apparel flow end-to-end (upload → generate → editable layer → template drop-in).
  - **Week 2:** Build the beauty flow and the combined skin+apparel color-harmony suggestion; add diversity batch generation; film the two-tool-vs-one-tool demo comparison; write submission text and gather screenshots.
- **Dependency:** Demo video must show the tool functioning end-to-end on the actual target device/browser per hackathon rules — leave real buffer time for filming, not just development.
