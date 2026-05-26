# Denoisr · Web UI kit

The dashboard from the original brief, extended. 3-column desktop layout, 1280×760 baseline.

## Layout
```
┌──────────────────────────────────────────────────────────┐
│  Denoisr.        [ JOBS · PEOPLE ]        Home  Msgs  …  │  84px chrome
├──────────────────────────────────────────────────────────┤
│  Filters     │     Card stage      │   Detail preview    │
│  (1fr)       │     (1.15fr)        │   (1fr)             │
└──────────────────────────────────────────────────────────┘
```

## Components
- `WebShell` — page chrome + corner washes
- `WebHeader` — wordmark / mode switch / nav cluster
- `WebDashboard` — 3-column layout, holds state for the card stack
- `WebFilters` — left column: role / location / mode / experience / salary
- `WebCenterStage` — centre column: card deck with drag swipe, action bar
- `WebPreview` — right column: detail view of the top card (Jobs vs People variants)
- Plus `WebField`, `WebInput`, `WebSlider`, `Statlet` for inline use

## Pattern
The mode toggle in the chrome swaps both card and preview component. Card uses `SwipeCard` + Variant A renderer from `card-variants.jsx`. Two cards visible (top + scaled second behind) so the stack always has depth.
