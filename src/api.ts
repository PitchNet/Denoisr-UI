const AUTH_COOKIE_NAME = 'denoisr_auth_token'

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

export function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')

  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthTokenFromCookies()}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}
