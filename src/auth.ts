import { getAuthTokenFromCookies, apiRequest } from './api'

const AUTH_COOKIE_NAME = 'denoisr_auth_token'
const PROFILE_COOKIE_NAME = 'denoisr_profile'
const PROFILE_COOKIE_MAX_AGE_SECONDS = 60 * 10080
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10080
const SIGNUP_PLACEHOLDER_TOKEN = 'signup-token'
const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

type AuthResponse = {
  access_token?: string
  token_type?: string
}

export function setAuthToken(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  clearStoredProfile()
}

export function getAuthToken() {
  return getAuthTokenFromCookies()
}

export function hasAuthToken() {
  return getAuthToken() !== ''
}

export function isAuthenticated() {
  const token = getAuthToken()
  return token !== '' && token !== SIGNUP_PLACEHOLDER_TOKEN
}

export function getAuthenticatedUserId() {
  const token = getAuthToken()

  if (token === '' || token === SIGNUP_PLACEHOLDER_TOKEN) {
    return ''
  }

  try {
    const payload = token.split('.')[1]

    if (!payload) {
      return ''
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = JSON.parse(window.atob(normalizedPayload)) as {
      sub?: string
      user_id?: string
      userId?: string
      id?: string
    }

    return decodedPayload.user_id ?? decodedPayload.userId ?? decodedPayload.id ?? decodedPayload.sub ?? ''
  } catch {
    return ''
  }
}

export function hasSignupInProgress() {
  return sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY) !== null
}

export function clearAuthToken() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  clearStoredProfile()
}

export async function storeAuthTokenFromResponse(response: Response) {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  const data = (await response.json()) as AuthResponse

  if (data.access_token) {
    setAuthToken(data.access_token)
  }

  return data
}

type FilterValues = {
  role: string
  search: string
  country: string
  city: string
  experience: number
  salary: number
  bookmarked: boolean
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
  const json = JSON.stringify(profile)
  document.cookie = `${PROFILE_COOKIE_NAME}=${encodeURIComponent(json)}; Max-Age=${PROFILE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

export function clearStoredProfile() {
  document.cookie = `${PROFILE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
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
