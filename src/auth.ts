import { getAuthTokenFromCookies } from './api'

const AUTH_COOKIE_NAME = 'denoisr_auth_token'
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 30
const SIGNUP_PLACEHOLDER_TOKEN = 'signup-token'
const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

type AuthResponse = {
  access_token?: string
  token_type?: string
}

export function setAuthToken(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
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
