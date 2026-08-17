# Modelier

A VTO-native design canvas for small fashion and beauty brands — upload a
product photo, generate an on-model (or on-face) render with real YouCam AI
APIs, and drop it straight into a branded template, without leaving the
canvas or exporting to a second tool.

Built on top of a real-time collaborative canvas editor (Next.js 14 + fabric.js
+ Liveblocks), with an "AI Model Studio" panel layered on top for the apparel
and beauty virtual try-on flows described in `PRD_MO~1.MD`.

## Why we're building this

Independent jewelry and apparel sellers are shut out of the two things that
actually move product online: professional photography and virtual try-on.
A single-day studio shoot for a small apparel brand runs
[$1,000–$5,000](https://www.squareshot.com/post/clothing-brand-photoshoot-cost)
just for the photographer, and a full campaign (models, styling, retouching)
lands at $14,000–$22,000 for maybe 30–60 finished images. That cost structure
only works for a brand already big enough to amortize it — everyone below
that line is stuck reusing supplier photos, or none at all.

Meanwhile the sellers who need this most are shrinking as a share of the
market: **35% of jewelry retail is still independent** (down from 42% in
2020, per [IBISWorld](https://www.ibisworld.com/united-states/industry/jewelry-designers/6504/)),
losing ground specifically to brands that *can* afford this kind of content.
Modelier's bet is that the same AI infrastructure the big players use —
CAD design, virtual try-on, generative photo/video — should be available to
a one-person shop as a single subscription, not a stack of five vendors.

## Market opportunity

- **Apparel returns are a $ and sustainability problem VTO directly attacks.**
  Online apparel return rates run **20–40%** (higher than any other
  e-commerce category — electronics run 8–15%, beauty 4–12%), and more than
  half of those returns are fit/sizing-related
  ([Richpanel](https://www.richpanel.com/learn/ecommerce-return-rates),
  [Ringly](https://www.ringly.io/blog/ecommerce-return-statistics-2026)).
  Virtual try-on has been shown to cut return rates by
  [25–40%](https://www.getfocal.co/post/virtual-try-on-in-e-commerce-a-research-summary)
  and lift conversion by
  [20–40%](https://uwear.ai/solutions/increase-conversion-rate) — a direct
  line from a feature we already ship to a seller's bottom line.
- **Generative AI in fashion is early and growing fast.** The generative-AI-
  in-fashion market is forecast to grow from roughly $0.18B (2025) to $0.25B
  in 2026, at a **~38% CAGR**, reaching an estimated $0.74B by 2030
  ([The Business Research Company](https://www.thebusinessresearchcompany.com/report/generative-ai-in-fashion-global-market-report)).
  Early enough that no single tool owns "the one place a small brand does
  this," which is the gap Modelier is aimed at.
- **Small businesses are already buying AI tools, just not integrated ones.**
  58% of small businesses now use at least one AI tool (up from ~23% in
  2023), and **27% already use AI specifically for image/visual content
  generation** — but the same data shows most of that adoption is scattered,
  single-purpose tools with no formal workflow around them
  ([theStacc](https://thestacc.com/blog/small-business-ai-adoption-statistics/)).
  That's the exact gap a single connected pipeline (CAD → photo → video →
  branded template) is meant to close, instead of one more disconnected point
  solution.
- **Discovery has moved to short-form video.** [46% of shoppers](https://autofaceless.ai/blog/social-commerce-statistics-2026)
  now say social platforms are where they discover what to buy — which is
  why Video Studio isn't a bolt-on, it's the natural output of the same
  pipeline that already made the photo.

## What's actually implemented

- **Apparel flow**: upload a flat-lay/mannequin photo, pick a category (top /
  bottom / dress-outfit / auto), generate against one or a diverse batch of
  synthetic reference models — real calls to YouCam's AI Clothes Virtual
  Try-On V3.
- **Beauty flow**: pick a lip shade, generate against a reference model's face
  — real calls to YouCam's AI Makeup Virtual Try-On.
- **Skin + apparel color-harmony suggestion**: each reference model's
  undertone was captured once via a real YouCam AI Skin Tone Analysis call at
  seed time; every apparel generation extracts the garment's dominant color
  locally and flags the best-matching variant with a specific note.
- **Templates**: a small gallery of starter layouts (Instagram post/story,
  product listing), each with a tagged placeholder region a generated variant
  can be dropped straight into.
- **Brand Kit**: logo, color palette, and font pair, persisted per account.
- **Projects**: save the current canvas as a named snapshot, reload it later.
- Full auth (register/login), and every user's canvas lives in its own
  Liveblocks room (not shared across accounts).

Reference models are **fully synthetic** — generated from text prompts via
YouCam's own AI Image Generator, never a real person's photo — per the PRD's
hard requirement.

## Demo account (for judges)

A real account with a full, in-use "Blush Riot" brand workspace (Jewelry CAD
designs, AI Model Studio generations, canvas Projects, Video Studio projects —
see `hackathon.md` for the full writeup) is already seeded and ready to
explore, no setup required beyond running the app:

|          |                              |
| -------- | ---------------------------- |
| Email    | `md.hatifosmani15@gmail.com` |
| Password | `L8sBzCt96XNiQSsyKrpe`       |

Log in with these at `/login` after starting the app (see **Setup** below) to
see everything already built, rather than an empty new account.

## Demo video

[Watch the 3-minute walkthrough](https://youtu.be/1-rzN3CNLnA) — recorded
live against the account above, screen-captured on the actual desktop browser
this app is built for (see `DEMO_SCRIPT.md` for the shot-by-shot script and
which YouCam endpoints are called out on camera).

## Prerequisites

- Node.js 20+
- A Supabase project (Postgres + Storage)
- A YouCam / Perfect Corp API key (server-only, never exposed to the client)
- A Liveblocks project (public key)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy `.env.example` to `.env.local`** and fill in:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | [liveblocks.io/dashboard](https://liveblocks.io/dashboard/apikeys) |
   | `YOUCAM_API_KEY` | Perfect Corp API console (server-only secret) |
   | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` | Supabase project → Settings → API |
   | `DATABASE_URL` | Supabase → Settings → Database → **Transaction pooler** connection string |
   | `DIRECT_URL` | Same page — if the literal `db.<ref>.supabase.co:5432` host doesn't resolve from your network (it's IPv6-only on some Supabase regions), use the **session pooler** variant instead: same pooler host as `DATABASE_URL`, port `5432`, no `pgbouncer=true` flag. `prisma db push` needs this one, not the transaction pooler. |
   | `AUTH_SECRET` | `npx auth secret` |

3. **Push the schema** (this project uses `prisma db push`, not migrations — there's no migration history to run):

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed reference models and templates** (one-time; the reference-model step
   makes real YouCam API calls — text-to-image + skin-tone-analysis for 4
   profiles, roughly 84 units total on YouCam's unit pricing):

   ```bash
   npm run db:seed-reference-models
   npm run db:seed-templates
   ```

   `db:seed-reference-models` also creates a `modelier-public` bucket in
   Supabase Storage on first run and re-hosts each generated photo there for a
   permanent URL (YouCam's own result URLs expire in ~2 hours).

5. **Run it**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, register an account (the whole app sits
   behind `middleware.ts` — there's no anonymous access), and use the **AI
   Model** tab in the left panel.

## Verifying the setup

```bash
npm run db:smoke
```

Confirms `DATABASE_URL` is reachable and at least 4 active reference models
exist.

## Architecture notes

- **Canvas**: fabric.js, synced via Liveblocks (`lib/canvas.ts`, `lib/shapes.ts`,
  `app/App.tsx`). Custom per-object properties (`objectId`, `isPlaceholder`)
  don't survive fabric's default `toObject()`/`toJSON()` — they're manually
  re-attached in `syncShapeInStorage` (see the comment there) before being
  stored in the Liveblocks `LiveMap`.
- **YouCam integration** (`lib/youcam/`): `client.ts` owns the bearer-token
  auth and the generic upload → create-task → poll-status primitives; each
  feature (`clothesVto.ts`, `makeupVto.ts`, `skinToneAnalysis.ts`,
  `textToImage.ts`) is a thin, isolated wrapper, so a schema surprise from the
  real API only ever touches one file.
- **Async generation**: the client polls `GET /api/generations/{id}/status`
  every ~2s (`hooks/useInterval.ts`); each poll does exactly one status check
  per still-processing variant against YouCam directly. No queue, no
  background worker — real task latency has been observed anywhere from ~10s
  to several minutes, since YouCam's own docs note execution time isn't
  guaranteed.
- **Color harmony** (`lib/colorHarmony.ts`): deterministic and local. The
  *real* Skin Tone Analysis API call happens once per reference model at seed
  time — that's where the genuine skin-AI ↔ apparel-VTO fusion lives; scoring
  a garment's color against an already-known undertone per-generation is
  cheap and burns zero extra YouCam units.
- **Storage**: Supabase Storage (`lib/storage.ts`), not Vercel Blob — chosen
  because the project already had a Supabase project provisioned.
- **Diversity batch cap**: `MAX_DIVERSITY_BATCH = 4` in
  `app/api/generations/route.ts` protects the unit allotment from a single
  runaway request.

## Reference model IDs

Seeded by `npm run db:seed-reference-models`:

| ID | Label |
|----|--------|
| `cm0refmodel000000000000001` | Model A — fair, slim |
| `cm0refmodel000000000000002` | Model B — medium olive, athletic |
| `cm0refmodel000000000000003` | Model C — deep warm, curvy |
| `cm0refmodel000000000000004` | Model D — rich neutral, plus |

## Roadmap

Roughly in build order, each phase assuming the one before it has real users
on it rather than shipping speculatively:

1. **Manufacturing handoff for Jewelry CAD.** STL/STEP export already works;
   next is a direct submission flow to small-batch casters/3D-printing
   services, so a design goes from slider to a physical sample without ever
   leaving the app.
2. **Commerce integration.** A Shopify/Etsy listing sync — push a finished
   render or CAD export straight to an existing storefront instead of a
   manual re-upload, and pull in a seller's existing product catalog as the
   VTO source photo instead of requiring a fresh upload.
3. **Team accounts.** Right now every account is a single Liveblocks room;
   a small studio (a designer + a shop owner + a photographer) needs shared
   projects with per-seat access, not one shared login.
4. **Analytics on what actually converts.** Which generated variant, which
   template, which color-harmony match a seller actually published and sold
   against — closing the loop the VTO conversion/return-rate research above
   only speaks to in the abstract.
5. **Mobile capture companion.** A lightweight phone-camera flow for the flat-
   lay/product photo step specifically (the one part of this pipeline that
   still has to start on a physical object), feeding straight into the
   desktop studios rather than becoming a second full app.
6. **Adjacent verticals**, per the use cases identified in `hackathon.md`:
   watch and eyewear resellers (near-identical VTO shape to jewelry), bridal
   party group sessions, and B2B wholesale catalogs for manufacturers
   generating VTO sets for retail partners instead of shipping physical
   samples.

## Go-to-market plan

- **Phase 1 — design-partner beta (now–3 months).** A small cohort (10–20)
  of independent jewelry and apparel sellers recruited directly from Etsy
  seller communities, small-batch jewelry trade shows, and maker-focused
  subreddits/Discords — free access in exchange for direct feedback, since
  the studios (CAD, VTO, video) need real sellers' actual products to prove
  out edge cases synthetic test content can't surface.
- **Phase 2 — self-serve launch (3–9 months).** Tiered subscription pricing
  keyed to YouCam unit consumption (a hard cost this app already has to pass
  through), with a free tier capped on generations/month as the actual
  acquisition funnel — content marketing around the same cost comparison
  this README opens with ("what a photoshoot actually costs vs. this"), plus
  a Shopify App Store listing once the commerce integration above ships,
  since that's where most of this exact seller segment already has a
  storefront.
- **Phase 3 — vertical expansion (9+ months).** Once apparel/jewelry retention
  is proven, expand into the adjacent verticals from the Roadmap — each is a
  copy of the same VTO/CAD/video pipeline with a different product category
  and reference-model set, not a rebuild.
- **Durable moat, not just first-mover speed.** Any single studio here (VTO,
  CAD, video) is individually replicable by a competitor calling the same
  YouCam API. What's harder to replicate is the *connected* pipeline — a
  render that's already inside a branded template, a CAD export that's
  already framed by the same brand kit, a still that's already become a
  video ad — which is the actual product decision this whole build is built
  around, not any one feature in isolation.
