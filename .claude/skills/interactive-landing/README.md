# Interactive landing pages — motion principles

This skill exists because a static Editorial Mono page (flat cards, no gradients, no 3D)
can still feel inert if it never moves. The goal is motion that reads as **considered**,
not motion that reads as a SaaS template. Four reference points shaped this — one
independently verified by fetching the live site's CSS, the rest only available as
secondhand descriptions (flagged below, treat accordingly):

## What we looked at, and how confident each finding is

Two confidence levels appear below: **verified** (pulled directly from the live site's
served HTML/CSS via `curl`, real font/color/timing values) and **reported** (only a
text description was available — either from a small summarizer model or an Awwwards
write-up — and the live design data is unreachable). Don't promote a "reported" item to
a hard spec; treat it as directional only.

**21st.dev hero components (reported — general survey, not one specific component, no
live data pulled).**
The structural pattern worth keeping: mono eyebrow badge → headline capped at two lines,
serif `<em>` on one word only → a *functional* right-side element, not a decorative
mockup → a thin proof strip under the CTA. Worth rejecting: gradient/glow washes behind
the headline, 3D tilt mockups, autoplaying product videos. Denoisr's hero already does
the "functional element" part right (`InteractiveDeck` in `ProductPage.tsx` is live, not
a screenshot) — lean further into that rather than adding decoration around it.

**"How F1 has evolved since 1950" (ESPN feature, awwwards-listed) — mostly unverifiable,
correct the earlier claim.**
A previous pass through this skill stated a `#F4EEE6` cream / `#DF4125` accent palette
for this page. That came from an AI summary of an Awwwards write-up, not the live site,
and turned out to be **wrong** — the page sits behind an AWS WAF bot challenge, and even
the Wayback Machine snapshot shows no bespoke palette at all. What *is* verifiable from
the served markup is that this runs on ESPN's standard "OTL" (Outside The Lines) feature
template — house fonts BentonSans, Publico, and Tungsten, loaded from `espncdn.com` — not
a custom-built microsite. The actual scrollytelling visuals are rendered by a runtime JS
bundle that never appears in any static fetch, so its real colors/type are unverified and
should not be cited as fact. **Keep only the structural idea** — staged, one-beat-at-a-time
scroll reveals for narrative content — and drop the specific hex codes from any future spec.

**Cleo AI — unverifiable, reported only.**
`web.meetcleo.com` (and `www.meetcleo.com`) return a `403` from Cloudflare bot protection
on every attempt, including spoofed browser headers; no Wayback snapshot exists either.
Nothing here is independently confirmed. The only thing worth keeping is the *descriptive*
framing from the Awwwards write-up — "ultra-modern, silky-smooth, un-bank-y," smooth
Framer-style transitions — as a vibe reference, not a spec. Do not cite specific colors,
fonts, or timing values for Cleo; none were obtainable.

**Intencv (verified — `curl`'d the live site and its served `index-*.css`).**
This is real, confirmed data, not a description:
- Stack: React + **Three.js** (`vendor-three-*.js`) + **Framer Motion** (`vendor-motion-*.js`)
  + **Lenis** (`vendor-lenis-*.js`, a smooth-scroll/scroll-hijacking library) + Tailwind v4.
- Dark theme: `theme-color` meta is `#0B0D11`; body/section backgrounds in the CSS are
  `#0b0d12` / `#0b0f14` / `#080a10` — a near-black, not a light "paper" surface at all.
- Off-white text/foreground: `#f2f0ef` (their `--color-white` token) on the dark backgrounds.
- Headings (`h1, h2`) are set in **Radley**, a serif — body text falls back to
  `ui-sans-serif/system-ui`. So the serif is load-bearing for headlines, sans for body —
  structurally similar to Denoisr's serif-`<em>`-as-accent rule, but Intencv uses serif for
  the *whole* headline rather than one word.
- Accent is a blue gradient family: `#3b82f6` → `#2563eb`, with lighter variants `#7fa2ff`
  / `#5a76f5` — a single hue ramp used for emphasis (buttons, gradient text), not Denoisr's
  multi-pastel-wash approach.
- Radius scale: `--radius-lg: .5rem` (8px), `--radius-xl: .75rem` (12px) — notably smaller
  than Denoisr's 22-24px card radius.
- Default transition: `150ms`, `cubic-bezier(.4,0,.2,1)` — close to Denoisr's `--dur-fast`
  (120ms) but using Tailwind's standard ease-in-out rather than Denoisr's custom
  `--easing-default` curve.
- Uses real `drop-shadow` filters and gradient fills — both directly prohibited by
  Denoisr's brand rules.

**Reference only, do not imitate stylistically** — same career-tech space as Denoisr, but
everything verified above (dark theme, 3D, gradients, drop-shadows, tight 8-12px radii) is
the opposite of Editorial Mono's flat, paper-light, 22-24px-radius, gradient-free system.
Useful as a concrete "what we are not" comparison precisely *because* it's now verified
rather than guessed — Denoisr's differentiation is calm and flat where this competitor is
dark, 3D, and gradient-heavy.

## Principles, distilled

1. **Motion marks emphasis, not decoration.** Every animated element should be telling the
   user something just became relevant (a card entered view, a number resolved, a decision
   was made) — never motion for its own sake. This matches the existing decision-color rule:
   `--decision-pass` / `--decision-like` only appear on swipe gestures, never on idle chrome.
   Scroll reveals and hover states should follow the same logic.
2. **One viewport, one beat.** Narrative sections (`#vs`, `#research`, `#how`) should reveal
   in discrete stages tied to scroll position — one row, one card, one claim per beat —
   rather than animating everything in a section at once. This is the F1-site's reported
   structural technique (unverified in detail, but the "narrative, staged reveal" framing
   is consistent across the source description, so it's reasonable to borrow the idea
   without citing it as a confirmed spec).
3. **Functional over decorative.** If a hero or section can demonstrate the product live
   (the swipe deck, an import-flow preview, a live counter), do that instead of an
   illustrated/3D mockup. This is both more honest and cheaper to maintain.
4. **Reuse the existing motion tokens.** `landing.css` already defines `--dur-fast` (120ms),
   `--dur-base` (220ms), and `--easing-default` (`cubic-bezier(0.2, 0.7, 0.25, 1)`). New
   scroll/hero animation should use these, not introduce a second motion language. Note
   `landing.css` also references an undefined `--dur-card` (used on `.el-herocard`) —
   define it alongside the others (e.g. `320ms`) rather than leaving it to fall back silently.
5. **Playful means restrained-surprising, not cartoonish.** In-brand playful: a mono numeral
   that counts up once when it scrolls into view, a card that tilts 1-2deg on hover before
   settling back, a cursor-following accent dot the size of the existing `--decision-like`
   dot. Out-of-brand: confetti, bounce easing, emoji reactions, parallax tilt on 3D layers,
   looping ambient animation that never settles.
6. **Respect `prefers-reduced-motion`.** Every scroll reveal and hero animation needs a
   reduced-motion fallback that simply shows the end state. `scroll-reveal.css` and
   `useScrollReveal.ts` already handle this — don't bypass it when adding new animations.

## When proposing a design

Name which reference you're drawing from, why, and its confidence level — verified
(Intencv) vs. reported (21st.dev structure, F1's reveal framing, Cleo's vibe). Never cite
a "reported" detail (a specific hex code, font name, or timing value for the F1 page or
Cleo) as if it were confirmed — only Intencv's specifics are real. Don't invent a generic
"modern landing page" either — ground every motion choice in one of the principles above,
or call out explicitly that it's a new idea outside this set.
