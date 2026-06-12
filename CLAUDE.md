# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then `vite build`. The TypeScript step is part of the build; treat type errors as build failures.
- `npm run lint` — flat-config ESLint over the repo
- `npm run preview` — serve the production build locally
- `npx playwright test` — run the e2e suite (boots Vite via `webServer` in `playwright.config.ts`)
- `npx playwright test tests/e2e/landing.spec.ts` — run a single spec
- `npx playwright test --ui` — open the Playwright UI for debugging

## E2E tests

Playwright lives in `tests/`. Structure:
- `tests/e2e/*.spec.ts` — specs grouped by surface (landing, auth, info-pages, home, home-advanced, dashboard)
- `tests/pages/*.page.ts` — Page Object Model wrappers; each route has its own POM
- `playwright.config.ts` — chromium-only, `baseURL` http://localhost:5173, auto-starts the dev server

Protected pages (`/home`, `/dashboard`, `/messages`) are tested with the API mocked via `page.route('**/FeedController/*')`. The `HomePage` POM injects a fake JWT cookie so the route guard lets us in. The Dashboard POM seeds `sessionStorage` with the signup-in-progress flag.

## Environment

Required Vite env vars (read at build/dev time via `import.meta.env`, see `src/api.ts` and `src/supabase.ts`):

- `VITE_API_BASE_URL` — base URL for the Denoisr backend (e.g. `https://denoisr-api.onrender.com`, or `http://127.0.0.1:8000` locally)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project credentials, used by the realtime client

`apiRequest` will throw on `.replace` if `VITE_API_BASE_URL` is missing — make sure `.env` is populated before running.

## Architecture

Single-page React 19 + TypeScript + Vite app deployed to Vercel (`vercel.json` rewrites all paths to `index.html` so client-side routing works on hard refresh).

### Routing & auth gating

`src/App.tsx` defines all routes. Three categories:

- `PublicOnlyRoute` (`/`, `/login`, `/signup`) — redirects authenticated users to `/home`
- `ProtectedRoute` (`/home`, `/dashboard`, `/messages`) — redirects unauthenticated users to `/login`
- Unguarded marketing/legal pages (features, about, careers, privacy, etc.)

Both guards live in `src/components/AuthGuard.tsx` and key off `isAuthenticated()` from `src/auth.ts`. A special case: `/dashboard` is accessible mid-signup via the `hasSignupInProgress()` sessionStorage flag, before a real token exists.

### Auth model

JWT stored in a cookie (`denoisr_auth_token`), not localStorage. Lifecycle in `src/auth.ts`:

- `setAuthToken` / `clearAuthToken` write the cookie with `Max-Age=60*10080` (one week — see commit `5d36637`)
- `getAuthenticatedUserId` decodes the JWT payload client-side and tries `user_id`/`userId`/`id`/`sub` in that order — backend responses may use any of these claim names
- `SIGNUP_PLACEHOLDER_TOKEN = 'signup-token'` is treated as "not really authenticated" so the signup flow can store a sentinel without unlocking protected pages

### API layer

`src/api.ts` exposes a single `apiRequest(path, { method, body })` helper that defaults to `POST`, JSON-serializes the body, and attaches `Authorization: Bearer <cookie>`. The Denoisr backend uses controller-style paths like `/FeedController/getMessages` (see `MessagesPage.tsx`). When adding new endpoints, go through `apiRequest` so the auth header and base URL stay consistent.

### Supabase

`src/supabase.ts` exports a single shared `supabase` client. It's used alongside the REST API — primarily for realtime subscriptions on the messages feature, not as the source of truth for auth (auth tokens come from the Denoisr backend, not Supabase Auth).

### Styling — Editorial Mono is authoritative

**Design source of truth:** `.claude/skills/denoisr-design/` (the skill folder). Its `README.md` is the brand spec; `colors_and_type.css` is the token vocabulary. The legacy `design.md` at the repo root is **out of date** and being phased out — it describes an older "pure white / The Future font / magenta + orange" direction that's no longer the brand.

**Before writing or editing any CSS, read `.claude/skills/denoisr-design/engineering-rules.md`.** It codifies the CSS/React pitfalls this codebase has shipped (and caught the hard way): media-query specificity conflicts, mobile-overflow from hardcoded desktop dimensions, the legacy `denoisr.css` override pattern, viewport-test gaps. The file ends with a pre-flight checklist; run it before claiming visual work is done.

**CSS load order (from `src/main.tsx`):**
1. `src/index.css` — minimal resets
2. `src/styles/editorial.css` — global Editorial Mono tokens at `:root`, base type, `.btn` / `.nav` / `.footer` / `.info` / `.auth` styles. Also **aliases the legacy `--d-magenta / --d-orange / --d-dark / --d-lavender / --d-shadow-elev` tokens to editorial equivalents** so older pages inherit the new palette without per-page rewrites.
3. `src/styles/landing.css` — scoped under `.editorial-landing`, only loaded by `ProductPage.tsx`.

**Editorial Mono fundamentals (must obey):**
- Page background is `--paper` (#fbfaf6), never pure white.
- Fonts: `Geist` for sans, `Geist Mono` for eyebrows/numerals/metadata, `Instrument Serif` italic only for accents (pull quotes, occasional `<em>` in titles).
- Wordmark always renders as `Denoisr.` with the period dimmed (`--ink-4`).
- Sentence case everywhere except mono eyebrows (UPPERCASE, +1.4 tracking).
- No emoji, no gradient buttons, no left-border-accent cards, no hand-drawn SVG illustrations.
- Cards = 22–24px radius, warm-tinted layered shadows (never neutral grey).
- Decision colors (`--decision-pass` clay-red, `--decision-like` moss-green) appear **only** on swipe gestures, never on idle UI chrome.

### Pages — migration status

Routes live in `src/pages/`, wired in `src/App.tsx`. On `/` only, App.tsx hides the global `Navbar` and `Footer` so the editorial landing owns its own chrome.

**All pages now migrated to Editorial Mono.** Each has its own scoped stylesheet under `src/styles/` and JSX uses namespaced class prefixes (no longer the old legacy classes from `denoisr.css` which has been removed):

- `ProductPage.tsx` (`/`) — landing. Interactive swipe deck, Jobs/People mode toggle, `vs the feed` comparison, real-cited research, FAQ accordion, inline invite form. Scoped under `.editorial-landing` in `landing.css`. App.tsx hides the global Navbar/Footer here.
- `InfoPage.tsx` — long-form article layout used by 11 marketing/legal/info wrapper pages (About, Careers, Contact, CookiePolicy, Features, ForRecruiters, HelpCenter, HowItWorks, PrivacyPolicy, Security, Status, TermsOfService). Editing a wrapper just changes `label / title / paragraphs`. Styles in `editorial.css` under `.info`.
- `LoginPage.tsx`, `SignupPage.tsx` — editorial auth card with pastel wash, mono labels, pill primary button. Styles in `editorial.css` under `.auth`.
- `HomePage.tsx` (`/home`) — 3-column dashboard (filters · deck · preview) per the skill's `ui_kits/web/` spec. Drag-swipe, decision stamps that fade in proportional to drag distance, "It's a fit." match overlay, mobile bottom-nav, mobile chip rail for active filters. Scoped CSS in `home.css`, prefix `hp-`.
- `DashboardPage.tsx` (`/dashboard`) — profile composer with repeatable rows (highlights / tags / proof sections), typeahead suggestions, sticky right rail. Scoped CSS in `dashboard.css`, prefix `dp-`.
- `MessagesPage.tsx` (`/messages`) — 3-col chat (connections · thread · profile context), ⌘+↵ to send, ink-on-paper outbound bubbles vs paper-on-paper inbound, Supabase realtime subscription preserved. Scoped CSS in `messages.css`, prefix `mp-`.
- Shared components: `Navbar`, `Footer`, `Button`, `LoadingState` — restyled via `editorial.css`.

**`denoisr.css` has been removed** — its 18 in-use classes (`.denoisrApp`, `.denoisrMain`, `.btn` system, `.sectionLabel`, etc.) were merged into `editorial.css`. The ~3300-line legacy file is gone.

### Data layer

Heavy pages own their own data fetching and realtime subscriptions — there is no shared data layer, state manager, or query library. If you add cross-page state, note that the current architecture deliberately avoids global stores.

### Related repos (cloned to parent directory)

- `../Denoisr-API/` — Python backend (FastAPI-style; `app/`, `db.py`, `requirements.txt`). The `VITE_API_BASE_URL` points at this service in production.
- `../Denoisr-DB/` — schema and `DDL/` for the Postgres database the API talks to.

When debugging API responses or adding new endpoints, check `../Denoisr-API/app/` rather than guessing at the schema. The UI's `apiRequest` paths (`/LoginController/login`, `/FeedController/getMessages`) map directly to controllers in that repo.
