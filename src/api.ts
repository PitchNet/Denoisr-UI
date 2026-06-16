const AUTH_COOKIE_NAME = 'denoisr_auth_token'

let _lastExhaustedToastAt = 0
const EXHAUSTED_TOAST_DEBOUNCE_MS = 10_000

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: JsonValue
}

export function getAuthTokenFromCookies() {
  const cookies = document.cookie.split('; ')
  const authCookie = cookies.find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))

  if (!authCookie) {
    return ''
  }

  return decodeURIComponent(authCookie.split('=').slice(1).join('='))
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  const url = `${baseUrl}${path}`

  const MAX_RETRIES = 10
  const BASE_DELAY = 500

  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: options.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthTokenFromCookies()}`,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })

      if (response.ok) return response

      if (response.status >= 400 && response.status < 500) {
        return response
      }

      lastResponse = response

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * BASE_DELAY
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * BASE_DELAY
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  const now = Date.now()
  if (now - _lastExhaustedToastAt > EXHAUSTED_TOAST_DEBOUNCE_MS) {
    _lastExhaustedToastAt = now
    window.dispatchEvent(new CustomEvent('api:exhausted', { detail: { path } }))
  }

  if (lastResponse) return lastResponse
  throw lastError ?? new Error('Request failed')
}
