# Modelier Design System

Modelier is a Canva-style design editor for fashion and jewelry businesses — AI model try-on, jewelry configuration, and canvas-based lookbook/catalog editing. This document is the single source of truth for how the product looks and feels. It follows the shape of [Canva's App UI Kit](https://www.canva.dev/docs/apps/app-ui-kit/) (semantic tokens, Rows/Columns spacing rhythm, a small confident component set) but with our own brand: **high-fashion, peppy, pink/black/white.**

If a component, color, or spacing value isn't described here, don't improvise — extend this document first, then implement.

---

## 1. Brand

**Positioning**: Canva for fashion & jewelry brands — the same one-click confidence, aimed at people shooting lookbooks and product catalogs instead of social posts.

**Personality**: peppy, bold, editorial. Runway-poster energy, not boutique-quiet. High contrast, generous whitespace, one loud accent color used with intent.

### Brand mark — the duotone gradient

Modelier's signature mark is a hot-pink → near-black diagonal gradient, the same structural role Canva's cyan→violet gradient plays for them:

```css
--gradient-brand: linear-gradient(135deg, #FF2E7E 0%, #170014 100%);
```

**Where the gradient is allowed:**
- The logo/wordmark
- Generation-in-progress states (progress bars, loading shimmer, skeleton pulse)
- Empty-state illustration accents

**Where it is NOT allowed** — everywhere else stays flat color, including primary CTAs:
- Buttons of any kind, including hero/marketing CTAs like "Create a design" or "Generate" — these use the plain solid `default` Button variant (`bg-primary`). A button being the most important action on the page isn't a reason for it to carry the gradient; the gradient's job is brand recognition (logo) and system-status feedback (loading), not emphasis — use size, placement, and `--radius-xl` (see §5) to make a CTA feel important instead.
- Body text, icons, borders
- Secondary/tertiary buttons
- Form controls, inputs, sliders
- Data/status colors (success, warning, error, info)

Flat pink (`--primary`) is the workhorse accent; the gradient is a special-occasion mark, not a texture to sprinkle everywhere.

---

## 2. Color tokens

Tokens are grouped semantically (Canva's Actions / Feedback / UI / Content split), stored as `H S% L%` triples in CSS custom properties (unchanged convention from today), consumed via Tailwind's `hsl(var(--token))` pattern already set up in `tailwind.config.ts`.

### Light theme

| Token | HSL | Hex (reference) | Role |
|---|---|---|---|
| `--background` | `330 20% 98%` | `#FBF6F8` | App/page background (workspace behind the canvas) |
| `--foreground` | `270 9% 4%` | `#0B0A0C` | Primary text/icons (ink black) |
| `--card` | `0 0% 100%` | `#FFFFFF` | Panels, cards, canvas paper |
| `--card-foreground` | `270 9% 4%` | `#0B0A0C` | Text on cards |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Dropdowns, tooltips, dialogs |
| `--popover-foreground` | `270 9% 4%` | `#0B0A0C` | Text on popovers |
| `--primary` | `337 100% 59%` | `#FF2E7E` | Brand pink — primary buttons, active states, links |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text/icons on primary pink |
| `--secondary` | `334 100% 92%` | `#FFDDEA` | Soft pink surface — selected chips, subtle highlight fills |
| `--secondary-foreground` | `270 9% 4%` | `#0B0A0C` | Text on secondary pink |
| `--accent` | `334 100% 78%` | `#FF8FC0` | Blush pink — hover tints, focus rings, decorative accents |
| `--accent-foreground` | `270 9% 4%` | `#0B0A0C` | Text/icons on blush |
| `--muted` | `330 15% 95%` | `#F3EDF0` | Muted surfaces (rail background, disabled fills) |
| `--muted-foreground` | `330 8% 42%` | `#6B636A` | Secondary/caption text |
| `--border` | `330 15% 89%` | `#E5DEE2` | Hairlines, dividers, input borders |
| `--input` | `330 15% 89%` | `#E5DEE2` | Input borders |
| `--ring` | `337 100% 59%` | `#FF2E7E` | Focus ring (matches primary) |
| `--destructive` | `356 90% 54%` | `#EF1E3E` | Delete/clear/error actions |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--success` | `152 55% 36%` | `#209661`-ish | Success states, completed generations |
| `--success-foreground` | `0 0% 100%` | — | Text on success |
| `--warning` | `38 92% 50%` | `#F5A623`-ish | Warnings, rate-limit notices |
| `--warning-foreground` | `270 9% 4%` | — | Text on warning |
| `--info` | `217 91% 60%` | `#3B82F6`-ish | Informational banners |
| `--info-foreground` | `0 0% 100%` | — | Text on info |
| `--radius` | `0.75rem` | — | Base corner radius (see §5) |

### Dark theme (`.dark`)

| Token | HSL | Role |
|---|---|---|
| `--background` | `270 12% 6%` | Ink black page background |
| `--foreground` | `330 25% 96%` | Off-white text |
| `--card` | `270 10% 10%` | Panels/cards float slightly lighter than background |
| `--card-foreground` | `330 25% 96%` | Text on cards |
| `--popover` | `270 10% 11%` | Dropdowns/dialogs |
| `--popover-foreground` | `330 25% 96%` | Text on popovers |
| `--primary` | `337 100% 63%` | Brand pink, lifted slightly for dark-surface contrast |
| `--primary-foreground` | `270 9% 4%` | Ink text on pink (better contrast than white in dark mode) |
| `--secondary` | `330 20% 18%` | Muted pink surface |
| `--secondary-foreground` | `330 25% 96%` | Text on secondary |
| `--accent` | `334 90% 68%` | Blush accent, dimmed for dark backgrounds |
| `--accent-foreground` | `270 9% 4%` | Text on accent |
| `--muted` | `270 8% 14%` | Muted surfaces |
| `--muted-foreground` | `330 10% 65%` | Secondary text |
| `--border` | `270 8% 18%` | Hairlines |
| `--input` | `270 8% 18%` | Input borders |
| `--ring` | `337 100% 63%` | Focus ring |
| `--destructive` | `356 85% 58%` | Error actions |
| `--destructive-foreground` | `0 0% 100%` | Text |
| `--success` | `152 50% 48%` | Success |
| `--success-foreground` | `270 9% 4%` | Text |
| `--warning` | `38 88% 58%` | Warning |
| `--warning-foreground` | `270 9% 4%` | Text |
| `--info` | `217 85% 68%` | Info |
| `--info-foreground` | `270 9% 4%` | Text |

**Rule of thumb**: neutrals lean toward a faint violet-black undertone (`H≈270-330`), never pure warm gray or pure cool gray — this is what makes black feel "fashion" instead of "generic SaaS."

---

## 3. Typography

- **Sans (UI + body)**: current `--font-sans` stack stays — a clean grotesque (system-ui fallback is fine; if a display font is licensed later, prefer something with confident, slightly condensed uppercase caps for headings, e.g. in the vein of Canva Sans or an Inter/Söhne-class grotesque).
- **Display/serif**: reserve `--font-serif` for large editorial moments only (dashboard hero headline, lookbook cover text templates) — this is what gives "high fashion" its magazine-cover feel against an otherwise clean sans UI.

### Scale

| Name | Size / line-height | Weight | Usage |
|---|---|---|---|
| `display` | 40px / 1.1 | 600 (serif optional) | Marketing/dashboard hero |
| `title` | 24px / 1.25 | 600 | Panel/section titles, dialog titles |
| `heading` | 18px / 1.3 | 600 | Card titles, subsection headers |
| `body` | 14px / 1.5 | 400–500 | Default UI text |
| `caption` | 12px / 1.4 | 400–500 | Helper text, metadata, timestamps |
| `label` | 11px / 1.3, uppercase, tracked | 600 | Form labels, chip labels, eyebrow text |

---

## 4. Spacing — the 8px unit

Adopt an 8px base unit (Canva App UI Kit's spacing primitive, its `Rows`/`Columns` `spacing="2u"` pattern). Use Tailwind's default 4px scale but treat multiples of 2 (`8px`, `16px`, `24px`, `32px`, `48px`) as the *preferred* stops for padding/gaps — avoid odd values like `p-3.5` or `gap-5` outside of hairline/icon-alignment fixes.

| Unit | px | Tailwind | Typical use |
|---|---|---|---|
| `0.5u` | 4px | `1` | Icon-to-label gap |
| `1u` | 8px | `2` | Tight stacks, chip padding |
| `2u` | 16px | `4` | Card padding, form field gaps |
| `3u` | 24px | `6` | Section spacing inside a panel |
| `4u` | 32px | `8` | Panel padding, major gaps |
| `6u` | 48px | `12` | Dashboard section spacing |

---

## 5. Radius & elevation

Canva's surfaces read rounder than ours currently do. New scale:

| Token | Value | Usage |
|---|---|---|
| `--radius` | `0.75rem` (12px) | Cards, panels, dialogs, inputs |
| `--radius-sm` | `0.5rem` (8px, `calc(var(--radius) - 4px)`) | Small controls, nested chips |
| `--radius-lg` | `1rem` (16px) | Large hero cards, dashboard tiles |
| `--radius-xl` | `1.375rem` (22px) | The heaviest, most prominent surfaces only — the "Create a design" modal shell and its body-level CTA. Not a general upgrade for `--radius-lg`; most dashboard tiles/cards stay at `lg`. |
| `--radius-pill` | `9999px` | Buttons that should read as pills, chips, tags, avatars |

### Shadows

Soft, neutral, tinted with the ink color at low opacity (not pure black) so shadows feel warm rather than harsh:

```css
--shadow-panel: 0 1px 2px 0 hsl(270 9% 4% / 0.05), 0 2px 6px -1px hsl(270 9% 4% / 0.06);
--shadow-popover: 0 8px 24px -4px hsl(270 9% 4% / 0.16), 0 2px 6px -2px hsl(270 9% 4% / 0.08);
--shadow-modal: 0 24px 48px -12px hsl(270 9% 4% / 0.28);
```

Dark mode: same structure, opacity raised (0.3 / 0.45 / 0.6) since dark-on-dark needs more contrast to register.

---

## 6. Motion

Today's UI is CSS-transition-only. Add `framer-motion` for anything beyond a simple hover/opacity fade — panel open/close, dialog enter/exit, generation-loading states, card hover-lift.

| Interaction | Duration | Easing |
|---|---|---|
| Hover (color/opacity) | 120ms | `ease-out` |
| Button press | 80ms | `ease-in` |
| Panel/flyout open | 220ms | `cubic-bezier(0.16, 1, 0.3, 1)` (Canva-style "ease-out-expo" pop) |
| Dialog/modal enter | 200ms | same expo-out, plus 4px→0 translate-y |
| Card hover-lift | 150ms | `ease-out`, translateY(-2px) + shadow step up |
| Generation progress shimmer | 1.4s loop | linear, brand-gradient sweep |

Never animate layout-affecting properties (width/height) without a fixed container — prefer `transform`/`opacity` for performance.

### Framer Motion vs. GSAP

Both are dependencies; each owns a distinct job so they don't drift into overlapping responsibilities:

- **Framer Motion** — anything whose animation state is *derived from React state/props changing*: conditional render, list membership (`AnimatePresence` when search-filtering a grid), route/mode transitions.
- **GSAP** (via `@gsap/react`'s `useGSAP` hook, for automatic cleanup) — *one-shot imperative sequences* that don't map to a single component's state: a page's first-paint entrance stagger across otherwise-unrelated elements, and hover micro-interactions finer than a CSS `:hover` or Framer `whileHover` naturally expresses (e.g. an icon pop).
- Plain CSS transitions (like `.hover-lift`) stay plain CSS — don't reach for either library for a two-property hover.

---

## 7. Iconography

`lucide-react`, stroke width `1.75` (slightly bolder than the library default `2` reads too thin at small sizes against rounder UI chrome; test both). Standard sizes: `16px` (inline/dense), `20px` (default control icon), `24px` (rail/nav icons).

---

## 8. Components

Base primitives live in `components/ui/`. Existing: `button`, `input`, `label`, `select`, `slider`, `switch`, `separator`, `tooltip`, `dropzone`, `accordion`, `collapsible`, `dialog`, `alert-dialog`, `context-menu`, `dropdown-menu`, `breadcrumb`, `pill-button`.

**Gaps to fill** (Radix-backed where a primitive exists):
- `card` — the base container for template tiles, result cards, dashboard tiles. Rounded (`--radius`), `bg-card`, `shadow-panel`, optional hover-lift.
- `badge` — small status/label pill (e.g. "New", "Beta", effect category tags).
- `tabs` (`@radix-ui/react-tabs`) — for any panel that needs top-level sub-navigation.
- `popover` (`@radix-ui/react-popover`) — lighter-weight than `dialog` for inline pickers (color swatch picker, quick settings).
- `progress` (`@radix-ui/react-progress`) — generation progress bars, using the brand gradient fill.
- `avatar` (`@radix-ui/react-avatar`) — collaborator avatars (currently custom in `components/users/Avatar.tsx` — migrate or wrap).
- `toast`/`sonner` — non-blocking success/error notifications (generation complete, export ready), replacing ad-hoc inline `GenerationStatus` banners where a transient toast fits better.

### Patterns

- **Rail + flyout**: a fixed icon rail (`PanelRail`) toggles a single slide-out panel (`PanelShell`) beside it. Only one flyout open at a time. This structural pattern doesn't change — only its visual chrome does (rounder active-state pill in `--primary`, motion-in on open).
- **Pill/chip selectors**: category pickers (flow selector, effect category, beauty shade) all use `pill-button` as their base — pill radius, `--secondary` fill when selected, `--muted` when idle.
- **Card grids**: templates, generation results, dashboard projects — consistent card component, `--radius-lg` on hero/dashboard tiles, `--radius` elsewhere, `shadow-panel` at rest → `shadow-popover` + 2px lift on hover.
- **Inspector sidebar**: `RightSidebar` groups settings into card-style sections (Dimensions, Text, Color, Opacity, Arrange, Export) with clear section headings (`label` typography) and consistent `2u`/`3u` internal spacing.
- **Empty states**: icon + short copy + primary CTA, centered, generous padding (`6u`+).
- **Generation status/progress**: brand-gradient progress bar + shimmer while running; success/error uses flat `--success`/`--destructive`, never the gradient.

---

## 9a. AI features

- **Style Assistant** (`lib/assistant/*`, `app/api/assistant/route.ts`, the "Style Assistant" rail tab) — a conversational panel that tool-calls into a small, reliable set of actions: generating a Magic Backdrop, recoloring the selected canvas object, and moving/resizing it. The LLM backend is provider-agnostic — set `ASSISTANT_PROVIDER` in `.env.local` to `anthropic` (default), `openai`, `gemini`, or `k2think` (MBZUAI's K2 Think, via an OpenAI-compatible endpoint you point `K2THINK_BASE_URL` at) and supply that provider's own key. No code changes needed to switch.
- **Magic Expand / Magic Eraser** (Adobe Firefly) — shown in the Accessories category as an **upcoming feature** badge until `FIREFLY_CLIENT_ID`/`FIREFLY_CLIENT_SECRET` are configured (see `.env.example`). Firefly is the intended provider for generic background-extend/object-removal because it's the only major generative-fill API trained exclusively on licensed content with commercial IP indemnification.

## 9. Accessibility

- Body text on `--background`/`--card` must hit WCAG AA (4.5:1) — verified for the tokens above (ink-on-white and off-white-on-ink both clear AA comfortably).
- `--primary` (#FF2E7E) on white is ~3.7:1 — sufficient for large text/icons and filled-button *backgrounds* (button text uses `--primary-foreground` white on the pink fill, which is what's being checked, not pink-on-white text), but do not use pink-on-white as small body text.
- Focus rings (`--ring`) must always be visible — never remove `focus-visible` outlines without an equivalent replacement.
- Don't rely on color alone for feedback states — pair with icon + text (already the pattern in `GenerationStatus`/`EffectAnalysisCard`).
