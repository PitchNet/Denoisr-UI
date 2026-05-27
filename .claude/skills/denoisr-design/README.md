# Denoisr Design System

**Editorial Mono** — the visual direction we shipped after exploring three aesthetics. Off-white paper, charcoal sans, mono small-caps eyebrows, restrained pastel washes. Built for a swipeable, high-signal alternative to the professional feed.

> Denoisr is the **anti-LinkedIn**: Tinder-style discovery for jobs and professional connections. Two modes (Jobs / People), one swipe vocabulary, mobile-first with a parallel web dashboard.

---

## Index

| File / folder | What's in it |
| --- | --- |
| `colors_and_type.css` | All design tokens as CSS custom properties — colors, type scale, spacing, radii, shadows, motion |
| `assets/` | Logo, wordmark, and any visual primitives |
| `preview/` | Small specimen cards that populate the Design System tab |
| `ui_kits/web/` | Pixel-spec recreation of the desktop dashboard |
| `ui_kits/mobile/` | iOS app surfaces — swipe deck, match moment, profile, filters, matches |
| `SKILL.md` | Agent-Skill-compatible entry point for downstream use |

---

## Content fundamentals

Denoisr's copy is **flat, declarative, and a touch editorial.** It addresses the user in the second person, but never patronisingly.

### Voice
- **Confident, not corporate.** "It's a fit." not "Congratulations on your match!"
- **Editorial, not promotional.** Headlines read like magazine ledes.
- **Mono labels are TYPESET LIKE SMALL CAPS** — uppercase, positive tracking. The job they do is signposting, not yelling.
- **Sentence case for everything else.** Buttons, body, titles. Never title case.
- **No emoji.** Ever. Use type, color, and shape instead.

### Casing rules
| Surface | Rule | Example |
| --- | --- | --- |
| Page titles | Sentence case | "Tune for relevance." |
| Buttons | Sentence case | "Send opener", "Apply filter" |
| Eyebrows | UPPERCASE with mono | "CURATED FOR YOU · TODAY" |
| Tag pills | Title case / proper nouns | "Series B", "Design Systems" |
| Body | Sentence case, full stops | — |

### Punctuation
- **The wordmark always carries a period:** `Denoisr.` The dot is the brand mark. Render it in `--ink-4` (dim) so the word reads as "Denoisr ·".
- **Middle dot (·) is the connective glue.** Used for metadata: `Berlin · Remote-friendly`, `Tokyo · willing to travel`.
- **Em dash for editorial breaks.** "Healthcare with the polish of consumer software — and the discipline to match."

### Tone examples
> "What you would solve" — never "Responsibilities"
> "It's a fit." — never "You matched!"
> "Mutual interest" — never "New match"
> "Tune for relevance." — never "Filters"
> "Curated for you · today" — never "Recommended jobs"

### Numbers
- Mono face. Always.
- Pad single digits with a leading zero in lists: `01 03 — 7 left` reads as `01 03 — 07 LEFT`.
- Salary ranges use the local currency symbol and an en-dash: `€95–120k`, `$180–220k`.

---

## Visual foundations

### Surfaces & paper
- **Page background is `--paper` (#fbfaf6)** — off-white, never pure white.
- **Cards sit on `--paper`**, separated by **shadow alone** (no border, or at most a 1px hairline at 4% opacity).
- **Pastel radial washes** anchor corners of major surfaces. Pink (top-right) + violet (bottom-left) is canonical. Mint and peach are reserved for People surfaces and the match moment respectively.

### Type
- **Geist** (sans) is the workhorse. 400 / 500 / 600 / 700.
- **Geist Mono** is the *signalling* face — eyebrows, labels, metadata, numerals. Always positive tracking (1.2–1.6px).
- **Instrument Serif** appears in *italic* only, sparingly, for pull quotes and editorial flourishes. Never a body face.
- **Headlines are tight (-0.7px → -1.6px), bodies are normal, mono is loose (+1.2 → +1.6px).** The contrast in tracking is the system's signature.

### Color
- **Strictly two-tone ink palette.** `--ink` (#1a1715) and 5 ramped alphas (--ink-2 … --ink-6).
- **Decision colors only appear during swipe gestures.** Clay red (#c44a39) and moss green (#2c8a55) on the SKIP / LIKE stamps; never on idle UI.
- **Swatches (oklch)** are for avatars and company chips. 8 swatches at constant lightness, walking the hue wheel. Don't introduce new ones.

### Spacing
- **4px base, 22px / 26px / 36px for layout.** Mobile cards pad at 22px; desktop cards pad at 26px; desktop page margins at 36px.
- **Mobile screens stack on tab bar + status bar; reserve the top 54px and bottom ~88px.**

### Backgrounds
- **No photography or stock imagery.** Avatars are letterforms on a swatch.
- **Pastel washes are the only "imagery"** — radial gradients with `transparent 70%`, offset off-edge so the centre never shows.
- **No textures, no noise, no patterns.** Clean paper.

### Borders & dividers
- **Hairline = 1px at ~14% black** for visible dividers (filter rows, metadata pills).
- **Faint = 1px at 6% black** for card borders and subtle internal splits.
- **Strong = 1.5px solid ink** only on the pull-quote left rule and decision-stamp outlines.

### Shadows
- **Layered, warm-tinted, never grey.** Three rules stack in `--shadow-card`: a hairline ring, a long soft drop, and a 1px outline.
- **`rgba(40,30,20,…)`** — warm brown undertone, not neutral black.

### Corner radii
- **Cards:** 22px (swipe), 24px (desktop panels), 18px (interior tiles).
- **Pills / buttons:** 999px (pill).
- **Tag chips:** 4px square or 999px pill — pick one per surface and commit.
- **Tag pills with mono inside use sharp-cornered black blocks** (0 radius). The contrast is intentional.

### Motion
- **`--easing-default`** = `cubic-bezier(.2,.7,.25,1)` for almost everything.
- **Card exits take 260ms.** Spring-back if below threshold is faster (~180ms feel).
- **Hover** = no transform; only opacity / background-color change at 120ms.
- **Press** = no shrink. Background darkens one step instead.

### Layout
- **Mobile is 402×874 (iPhone 14/15 baseline).** Status bar 54px, tab bar 88px.
- **Desktop dashboard is 3-column.** Filters (1fr) · Card stage (1.15fr) · Preview detail (1fr). All three panels are equal-height with `--shadow-panel`.
- **The mode switch (Jobs / People) is always centred in the chrome.** It's the most important toggle on the page.

### Transparency & blur
- **Tab bar uses `backdrop-filter: blur(20px)` over paper at 85% opacity.**
- **The match-moment "suggested opener" card uses `rgba(255,255,255,.6)` with `blur(10px)`.**
- **No other surface blurs.** Don't over-use frost.

### What we *don't* do
- No emoji.
- No gradient buttons.
- No left-border-accent cards.
- No colour-on-colour. Type sits on paper or ink — never on a coloured surface, ever.
- No hand-drawn SVG illustrations. If we need a visual, it's a wash or a typeset block.

---

## Iconography

Denoisr uses **stroke-based line icons drawn at 1.5–1.8 stroke weight, 22px viewBox, round caps & joins.** Hand-rolled inline SVG; the entire set fits in <200 lines so we don't ship an icon font.

| Icon | Where it appears | Spec |
| --- | --- | --- |
| Home (rooflined) | Bottom tab — Discover | 22×22, stroke 1.6 |
| Heart (rounded) | Bottom tab — Matches | 22×22, stroke 1.6 |
| Speech-bubble | Bottom tab — Inbox | 22×22, stroke 1.6 |
| Person (bust) | Bottom tab — You | 22×22, stroke 1.6 |
| × (close) | Pass action, sheet close | 22×22, stroke 2.2 |
| ↑ (boost) | Up-swipe action | 22×22, stroke 2.2 |
| ♥ (filled) | Like action | 22×22, stroke 2.2 |
| ↺ (rewind) | Undo last swipe | 22×22, stroke 2.2 |
| Bookmark | Save for later | 22×22, stroke 2.2 |
| Filter lines | Top-right of swipe deck | 18×18, stroke 1.6 |

**Action buttons** in the swipe deck are circular, white, with the icon stroked in the appropriate decision color (`--decision-pass` for ×, `--decision-like` for ♥, `--ink` for ↑).

**Avatar fallbacks** are *not* icons. They're 1–2-letter initials in `--font-sans` at 600 weight, on a swatch background, white text. The shape (circle vs square) varies by aesthetic; Editorial Mono is always circle.

**Logo / wordmark** lives in `assets/logo.svg`. There is no logomark — just the wordmark "Denoisr." with the period rendered dim.

---

## Sources

- Original brief: user-supplied screenshot of the existing web dashboard
- Card variants explored in `index.html` (sections "Card variants" — A, B, C)
- Variant A (this system) shipped as the canonical direction
