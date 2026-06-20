import { apiRequest } from './api'

const PROFILE_COOKIE_NAME = 'denoisr_profile'
const PROFILE_COOKIE_MAX_AGE_SECONDS = 60 * 10080
// Session cookies drive client-side routing/display (isAuthenticated,
// getAuthenticatedUserId). The auth JWT is returned by the API as
// access_token and stored in a JS-readable cookie — every API call sends it
// as a Bearer header so cross-origin deployments work even when third-party
// cookies are blocked. The httpOnly cookie (set by the API) is kept as a
// fallback for local dev where same-site cookies work.
const SESSION_COOKIE_NAME = 'denoisr_session'
const USER_ID_COOKIE_NAME = 'denoisr_user_id'
const AUTH_TOKEN_COOKIE = 'denoisr_bearer_token'
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 10080
const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

type AuthResponse = {
  user?: { id?: string; [key: string]: unknown }
  access_token?: string
}

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function setAuthTokenCookie(token: string) {
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

function clearAuthTokenCookie() {
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
}

export function getAuthToken(): string {
  return readCookie(AUTH_TOKEN_COOKIE)
}

function markSession(userId: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=1; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  if (userId) {
    document.cookie = `${USER_ID_COOKIE_NAME}=${encodeURIComponent(userId)}; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  }
  clearStoredProfile()
}

export function isAuthenticated() {
  return readCookie(SESSION_COOKIE_NAME) !== ''
}

export function getAuthenticatedUserId() {
  return readCookie(USER_ID_COOKIE_NAME)
}

/** Marks that an account has been started but the dashboard composer hasn't finished it yet. Stores only the email — never the password — so a leaked sessionStorage snapshot can't expose a plaintext credential. */
export function hasSignupInProgress() {
  return sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY) !== null
}

const PENDING_REDIRECT_KEY = 'denoisr_post_auth_redirect'

/** Remembers where to send the user after they finish logging in or signing up — e.g. back to a public job page they tried to apply to while logged out. */
export function setPendingRedirect(path: string) {
  sessionStorage.setItem(PENDING_REDIRECT_KEY, path)
}

export function getAndClearPendingRedirect(): string | null {
  const path = sessionStorage.getItem(PENDING_REDIRECT_KEY)
  sessionStorage.removeItem(PENDING_REDIRECT_KEY)
  return path
}

export function clearSession() {
  document.cookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  document.cookie = `${USER_ID_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  document.cookie = `${IS_ADMIN_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  clearAuthTokenCookie()
  clearStoredProfile()
  // Best-effort: clears the httpOnly cookie server-side. If this fails, the
  // cookie simply expires on its own at the end of its 7-day Max-Age.
  apiRequest('/LoginController/logout', { method: 'POST' }).catch(() => {})
}

export async function markAuthenticatedFromResponse(response: Response) {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  const data = (await response.json()) as AuthResponse

  if (data.access_token) {
    setAuthTokenCookie(data.access_token)
  }

  if (data.user?.id) {
    markSession(String(data.user.id))
  }

  return data
}

export type FilterValues = {
  role: string
  search: string
  country: string
  city: string
  experience: number
  salary: number
  bookmarked: boolean
  companyId?: string
}

export function getStoredFilters(mode: 'jobs' | 'people'): FilterValues | null {
  const name = `denoisr_filters_${mode}`
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1])) as FilterValues
  } catch {
    return null
  }
}

export function setStoredFilters(mode: 'jobs' | 'people', values: FilterValues) {
  const name = `denoisr_filters_${mode}`
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(values))}; Max-Age=${60 * 10080}; Path=/; SameSite=Lax`
}

export function clearStoredFilters(mode: 'jobs' | 'people') {
  const name = `denoisr_filters_${mode}`
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
}

export type CachedProfile = {
  headline: string
  subheadline: string
  organization: string
  photo: string
  [key: string]: unknown
}

export function getStoredProfile(): CachedProfile | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]))
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.headline === 'string') {
      return parsed as CachedProfile
    }
    return null
  } catch {
    return null
  }
}

export function setStoredProfile(profile: CachedProfile) {
  const existingGlass = getGlassMode()
  const json = JSON.stringify({ ...profile, glassMode: existingGlass })
  document.cookie = `${PROFILE_COOKIE_NAME}=${encodeURIComponent(json)}; Max-Age=${PROFILE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

export function clearStoredProfile() {
  document.cookie = `${PROFILE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
}

/** Read glass-mode preference from the denoisr_profile cookie */
export function getGlassMode(): boolean {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_COOKIE_NAME}=([^;]*)`))
  if (!match) return false
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]))
    return parsed?.glassMode === true
  } catch {
    return false
  }
}

/** Persist glass-mode preference to the denoisr_profile cookie */
export function setGlassMode(enabled: boolean) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_COOKIE_NAME}=([^;]*)`))
  let data: Record<string, unknown> = {}
  if (match) {
    try {
      data = JSON.parse(decodeURIComponent(match[1]))
    } catch {}
  }
  data.glassMode = enabled
  document.cookie = `${PROFILE_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; Max-Age=${PROFILE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

export async function fetchAndCacheProfile() {
  try {
    const response = await apiRequest('/ProfileController/getProfile', { method: 'GET' })
    if (!response.ok) return
    const data = (await response.json()) as Record<string, unknown>
    if (typeof data !== 'object' || data === null) return
    setStoredProfile(data as CachedProfile)
  } catch {
    // silently fail — profile will be fetched on next page load
  }
}

const IS_ADMIN_COOKIE_NAME = 'denoisr_is_admin'

/** Convenience flag only — not a security boundary. AdminController re-checks ADMIN_USER_IDS server-side on every gated request. */
export function getStoredIsAdmin(): boolean {
  return readCookie(IS_ADMIN_COOKIE_NAME) === '1'
}

export async function fetchAndCacheIsAdmin() {
  try {
    const response = await apiRequest('/AdminController/isAdmin', { method: 'GET' })
    if (!response.ok) return
    const data = (await response.json()) as { isAdmin?: boolean }
    document.cookie = `${IS_ADMIN_COOKIE_NAME}=${data.isAdmin ? '1' : '0'}; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  } catch {
    // silently fail — admin nav simply won't show until next successful check
  }
}
