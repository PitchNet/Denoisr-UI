---
name: interactive-landing
description: Use this skill when designing or building interactive landing/marketing pages for Denoisr — animated hero sections, scroll-triggered reveals, and playful micro-interactions — without breaking the Editorial Mono brand. Grounded in a review of 21st.dev hero patterns and Awwwards React showcase sites (the F1-evolution editorial site, Cleo AI, Intencv). Companion to denoisr-design, which owns the static tokens; this skill owns motion and structure.
user-invocable: true
---

Read `README.md` in this skill folder first — it has the reference sites, the principles distilled from them, and what to deliberately reject.

**Always read `denoisr-design/engineering-rules.md` and the brand constraints in its `SKILL.md` before touching production CSS/React.** This skill adds motion on top of that brand — it never overrides it. If a technique here conflicts with a brand rule (no gradients, no 3D, off-white paper, restrained washes), the brand rule wins.

Reusable pieces in this folder:
- `useScrollReveal.ts` — small IntersectionObserver hook for fade/stagger-up reveals, no dependencies
- `scroll-reveal.css` — the CSS classes that hook pairs with, built on the existing `--dur-*` / `--easing-default` tokens from `landing.css`
- `interaction-checklist.md` — the "playful but restrained" menu: what's in-brand motion vs what to reject, with a pre-ship checklist

If the user invokes this skill without specifics, ask which section they're animating (hero, a scroll section, a card grid) and whether this is for `ProductPage.tsx` or a new landing surface, then propose 1-2 concrete techniques from `README.md` rather than building all of them at once.
