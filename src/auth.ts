import { getAuthTokenFromCookies } from './api'

const AUTH_COOKIE_NAME = 'denoisr_auth_token'
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 30

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
