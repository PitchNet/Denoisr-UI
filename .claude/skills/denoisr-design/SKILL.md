---
name: denoisr-design
description: Use this skill to generate well-branded interfaces and assets for Denoisr, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Denoisr is a swipeable, professional alternative to LinkedIn — Tinder-style for jobs and connections. The visual direction is "Editorial Mono": off-white paper, charcoal sans, mono small-caps eyebrows, restrained pastel washes.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

**If you are writing production CSS or React for the Denoisr-UI codebase**, also read `engineering-rules.md` *before you start*. It codifies the specific CSS / React pitfalls this codebase has been bitten by — media-query specificity bugs, mobile-overflow from hardcoded desktop dimensions, the legacy `denoisr.css` override pattern, viewport-test gaps. Each rule has a "why" with the actual bug it prevents. Run the pre-flight checklist at the bottom of that file before claiming any visual work is done.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always load `colors_and_type.css` first so the token vocabulary is available. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key constraints to honour, even when shortcuts are tempting:
- Off-white paper (#fbfaf6) — never pure white
- Geist (sans) and Geist Mono only — Instrument Serif italic for pull-quotes only
- Mono eyebrows are uppercased with +1.4 tracking; everything else is sentence case
- No emoji; no left-border-accent cards; no gradient buttons; no hand-drawn SVG illustrations
- Cards = 22px radius, layered warm shadows (never grey)
- The wordmark always carries a dim period: "Denoisr."

Existing assets:
- `colors_and_type.css` — all design tokens as CSS custom properties
- `ui_kits/web/` and `ui_kits/mobile/` — pixel-spec recreations
- `preview/` — every token/component as a standalone HTML specimen
- `assets/logo.svg`, `assets/app-icon.svg`
