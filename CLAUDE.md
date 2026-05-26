# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then `vite build`. The TypeScript step is part of the build; treat type errors as build failures.
- `npm run lint` — flat-config ESLint over the repo
- `npm run preview` — serve the production build locally

There is no test runner configured.

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

### Styling

All styling is in a single global stylesheet `src/styles/denoisr.css` (~3300 lines, ~424 classes) imported once from `src/main.tsx`. There is **no CSS-in-JS, no Tailwind, no CSS modules** — components reference plain class names like `denoisrApp`, `denoisrMain`. Add new styles to `denoisr.css` and reuse the design tokens defined at the top (`--d-dark`, `--d-magenta`, `--d-orange`, `--d-lavender`, `--d-radius-sm/md`, `--d-shadow-elev`).

`design.md` is the authoritative design system spec (color palette, typography, spacing, dual light/dark world). Consult it before adding new visual elements — the brand has specific rules (e.g. magenta/orange only appear in illustrations, never as UI chrome; dark sections use `#010120` midnight blue, never gray-black).

Custom fonts (`The Future`, `PP Neue Montreal Mono`, `TT Interfaces`) live in `/fonts` and are `@font-face`-declared inside `denoisr.css`.

### Pages

`src/pages/` contains one component per route. Heavy pages like `MessagesPage.tsx` own their own data fetching and realtime subscriptions directly — there is no shared data layer, state manager, or query library. If you add cross-page state, note that the current architecture deliberately avoids global stores.
