# Modelier

A VTO-native design canvas for small fashion and beauty brands — upload a
product photo, generate an on-model (or on-face) render with real YouCam AI
APIs, and drop it straight into a branded template, without leaving the
canvas or exporting to a second tool.

Built on top of a real-time collaborative canvas editor (Next.js 14 + fabric.js
+ Liveblocks), with an "AI Model Studio" panel layered on top for the apparel
and beauty virtual try-on flows described in `PRD_MO~1.MD`.

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
