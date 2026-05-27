# Denoisr · Engineering rules

These are not visual rules — those live in `README.md`. These are the **CSS and React patterns** that the Denoisr-UI codebase has been bitten by. Read this before shipping any new page or restyle. Each rule has a *why* (the actual bug it prevents) so you can judge edge cases.

---

## Rule 1 — Media-query `display: none` must out-specify the base rule

**The bug.** You write:

```css
.hp-filters { display: flex; }        /* base, line 40 */

@media (max-width: 720px) {
  .hp-filters { display: none; }      /* mobile-only, line 80 */
}

.hp-panel { display: flex; }          /* base, line 120 — SAME ELEMENT */
```

At ≤720px the mobile rule looks like it wins, but `.hp-panel` and `.hp-filters` have **equal specificity** (one class each). The cascade picks the *later* source-order rule. The element has both classes, so `.hp-panel { display: flex }` at line 120 silently overrides the media-query rule at line 80. The filter panel never hides on mobile.

**This happened four times** in the Editorial Mono migration: `.hp-filters`, `.mp-context`, `.mp-sidebar--hiddenMobile`, `.mp-thread--hiddenMobile`. Each one broke mobile layout silently and shipped to main before being caught.

**The rule.** Any `display: none` inside a media query must use a selector that is *strictly more specific* than every base rule on the same element. Two safe forms:

```css
/* (a) Compound selector — wins on specificity */
@media (max-width: 720px) {
  .hp-panel.hp-filters { display: none; }
}

/* (b) Parent-scoped selector — wins on specificity */
@media (max-width: 720px) {
  .hp-shell .hp-filters { display: none; }
}
```

The compound `.hp-panel.hp-filters` has specificity 0,2,0 — beats any single-class base rule from anywhere in the file.

**The check before shipping.** For every media-query `display: none`, search the codebase for other `display:` rules on the same element. If any later rule sets `display: flex/grid/block` with equal specificity, fix the selector now.

---

## Rule 2 — No hardcoded layout dimensions without a mobile counterpart

**The bug.** You write `min-height: 460px` on a desktop card stage. Mobile inherits it. Mobile content (long mono header + two-line title + multi-line intro + wrapped chips + tags) easily exceeds 460px. Content overflows the card border into nowhere. Action buttons get pushed off-screen.

**The rule.** Any fixed numeric dimension (`width`, `height`, `min-height`, `min-width`, `padding` larger than ~24px, fixed `gap > 40px`) needs *either* an explicit mobile override *or* a written justification ("this fits both because X"). The default position is: desktop layouts do not survive mobile without rework.

**The checklist before shipping a new page:**

1. Every fixed dimension over 40px has a `@media (max-width: 720px)` override that either reduces it or relaxes it (`min-height: 0`, `min-width: auto`, etc.).
2. Cards and panels grow with their content on mobile (`position: relative`, not `position: absolute; inset: 0` in a constrained parent).
3. Decorative-only elements (stacked-card peeks behind the top card, secondary chrome) are hidden on mobile if they cost layout space.
4. Page-level `padding-bottom` clears the fixed mobile bottom nav (≥96px on pages that have it).

---

## Rule 3 — Always take a real screenshot at the target viewport before claiming "done"

**The bug.** Type-checks passing tells you the code compiles. It does not tell you the page renders correctly. The Editorial Mono migration shipped several pages where `npm run build` passed cleanly but the actual layout was visibly broken on the first real load.

**The rule.** Every visual change ships with at least one of:

- A real Playwright screenshot at the target viewport (see [verify pattern](#verify-pattern) below), or
- An invocation of the project's `verify` skill, or
- A manual `npm run dev` open-browser-and-look pass with the change visible.

Never write "done" or "ready to merge" purely from a green build. The build is a necessary, not sufficient, signal.

### Verify pattern

A one-off Playwright screenshot script for verifying a specific viewport:

```typescript
// tests/e2e/_screenshot.spec.ts  (delete after use)
import { test } from '@playwright/test'

test('mobile /home screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/home')
  // …seed any state needed…
  await page.screenshot({ path: 'mobile-home.png', fullPage: false })
})
```

Run: `npx playwright test tests/e2e/_screenshot.spec.ts`. Look at the PNG. Delete the file.

---

## Rule 4 — Mobile breakpoint must be exercised by a real test

**The rule.** Every page in `src/pages/` that has a mobile layout must have at least one Playwright spec that:

1. Calls `page.setViewportSize({ width: 390, height: 844 })` *before* navigation.
2. Asserts at least one mobile-specific behaviour (e.g., the bottom nav is visible, the desktop filter rail is hidden, the mobile mode pill is visible in the navbar).

See `tests/e2e/home-advanced.spec.ts` → `Home — mobile viewport` describe block for the canonical example. The `mobile bottom nav shows and filters panel is hidden` test is the one that caught the `.hp-filters` display-conflict bug; without it, that bug would still be in production.

---

## Rule 5 — Legacy `src/styles/denoisr.css` is dead — delete from it, don't add

**The bug.** The repo carries `src/styles/denoisr.css`, the old (pre-Editorial Mono) stylesheet. It loads *after* `editorial.css` in `main.tsx`. So its base rules silently override your new editorial base rules on equal specificity. The legacy `.nav__*` block hid the mobile mode pill regardless of what `editorial.css` did, because denoisr.css redefined `.nav__appLinks { display: flex }` and `.nav__modeSwitch { display: ... }` at base level.

**The rule.** When migrating a new component or page to Editorial Mono, **delete the corresponding block from `denoisr.css`** — don't leave it as a safety net. The safety net is a footgun: it activates exactly when you've forgotten about it.

The goal is `denoisr.css` shrinks to empty over time. If you add a new rule to `denoisr.css`, you are going backwards. New visuals always belong in `editorial.css` (globals) or in a scoped per-page stylesheet (`landing.css`, `home.css`, etc.).

---

## Rule 6 — One CSS feature, one place

**The bug pattern.** Multiple places define the same visual concern, and they drift. Three examples already caught:

- Mobile bottom nav: `.hp-bottomnav` defined in `home.css`, `.mp-bottomnav` defined in `messages.css`. Two different implementations of the same chrome. If you change the safe-area padding for one, the other rots silently.
- Action button: `.hp-actionbtn` (Home) and `.el-actionbtn` (Landing) — same circle button, two definitions.
- Mode switch: `.nav__modeSwitch` (chrome), `.el-mode` (landing chrome), `.hp-mobileMode` (deleted). Three Jobs/People pills, one canonical.

**The rule.** Before defining a new visual primitive in a per-page stylesheet, search `src/styles/*.css` for the same concept. If it exists, reuse it via a shared class in `editorial.css`. The per-page stylesheet should only contain *layout* (grid/flex shells), not duplicated primitives.

---

## Rule 7 — `<form noValidate>` shifts validation to JS — own it explicitly

The landing-page invite form uses `noValidate`. Browser-native required validation is bypassed. The JS submit handler does its own check (`email.includes('@')`). When you add a new field, the JS handler must validate it explicitly — `<input required>` alone won't trigger anything.

If a form is happy with browser-native validation, omit `noValidate` and let HTML5 do the work.

---

## Quick pre-flight checklist (run before every push of visual work)

- [ ] Searched the codebase for `display:` conflicts on every element I added a media query for.
- [ ] Every fixed dimension > 40px has either a mobile override or a written reason it doesn't need one.
- [ ] Took a real screenshot at 390×844 (or used the `verify` skill).
- [ ] Added at least one Playwright spec that sets a mobile viewport and asserts mobile-specific behaviour.
- [ ] Deleted any superseded block from `denoisr.css` instead of leaving it as a safety net.
- [ ] Did not duplicate a primitive that already exists in `editorial.css`.
- [ ] Ran `npm run build` and `npx playwright test`. Both green.

If any item is unchecked, the work is not done.
