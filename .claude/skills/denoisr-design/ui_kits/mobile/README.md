# Denoisr · Mobile UI kit

iOS 402×874 baseline. All six core surfaces, in iOS device frames, fully interactive (drag the cards).

## Screens
| # | File | What it shows |
|---|---|---|
| 01 | Jobs swipe | Curated role deck with swipe gestures + action bar |
| 02 | People swipe | Same shell, People mode toggle on |
| 03 | Match moment | "It's a fit" — paired avatars + suggested opener |
| 04 | Tune (filters) | Role, location, mode, experience, salary sliders |
| 05 | Matches | New-matches row + conversations list |
| 06 | Profile | Own profile, signal score, work history, looking-for |

## Files
- `mobile-screens.jsx` — every screen as a React component (`MobileJobsSwipe`, `MobileMatch`, `MobileFilters`, `MobileMatches`, `MobileProfile`) plus shared chrome (`MobileShell`, `MobileTopBar`, `ModeSwitch`, `ActionButton`)
- `swipe-card.jsx` — `SwipeCard` (real drag) + `SwipeStamp` overlay primitive
- `card-variants.jsx` — `VariantA_Job` / `VariantA_Person` (used here; B and C live alongside)
- `ios-frame.jsx` — device bezel + status bar
- `data.js` — mock jobs and people

## Pattern
Every screen reuses `MobileShell` (status bar pad, content area, frosted tab bar). Variants live inside; the shell is stable.
