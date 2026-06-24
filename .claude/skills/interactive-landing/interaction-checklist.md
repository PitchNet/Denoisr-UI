# In-brand playful vs. out-of-brand flashy

Use this as a quick filter when proposing or reviewing motion for a landing page.

| In-brand (ship it) | Out-of-brand (reject it) |
|---|---|
| One-time fade-up on scroll entry | Looping/ambient animation that never settles |
| Staggered reveal, one item per beat (90-120ms apart) | All items animating simultaneously (reads as a template) |
| Mono numeral counts up once when it enters view | Spinning odometer / repeated count-up on every scroll |
| Card raises its shadow on hover (opacity/box-shadow only) | Any transform on hover — tilt, lift, scale (violates brand motion law) |
| Accent color (`--decision-pass`/`--decision-like`) appears only at the emphasis beat | Accent color used as ambient background wash |
| Functional hero element (live deck, live import demo) | Decorative 3D mockup, looping product video |
| Cursor-following dot sized like the existing decision dots | Custom cursor replacing the system cursor entirely |
| `prefers-reduced-motion` fallback shows end state instantly | Motion that can't be disabled |
| Flat color transitions, existing `--easing-default` | Gradient glow, blur "aura," parallax tilt on 3D layers |
| Confetti / emoji / sound on a "match" or like | None of these, ever (see brand: no emoji, ever) |

## Pre-ship checklist

- [ ] Does every animated element mark a specific moment of emphasis (not decoration)?
- [ ] Narrative sections reveal one beat at a time, not all-at-once?
- [ ] Motion durations/easing pulled from existing `--dur-*` / `--easing-default` tokens (or `--dur-card`, once defined)?
- [ ] `prefers-reduced-motion: reduce` tested — end state shows immediately, no transition?
- [ ] No gradients, 3D, autoplay video, emoji, or confetti introduced?
- [ ] Hero's "wow" element is something the product actually does, not a mockup?
- [ ] Checked against `denoisr-design/engineering-rules.md` pre-flight checklist before calling it done?
