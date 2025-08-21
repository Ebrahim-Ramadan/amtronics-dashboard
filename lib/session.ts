import type { SessionData } from './types'

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4)
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad)
  return Buffer.from(normalized, 'base64')
}

export function parseSessionUnsigned(sessionCookieValue: string | undefined): SessionData | null {
  if (!sessionCookieValue) return null
  const parts = sessionCookieValue.split('.')
  if (parts.length < 1) return null
  const [body] = parts
  try {
    const json = JSON.parse(base64urlDecode(body).toString()) as SessionData
    if (json.exp && json.exp < Math.floor(Date.now() / 1000)) return null
    return json
  } catch {
    return null
  }
}

export function getSessionFromRequestHeaders(headers: Headers): SessionData | null {
  const cookieHeader = headers.get('cookie') || headers.get('Cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith('session='))
  const value = match?.split('=')[1]
  return parseSessionUnsigned(value)
}


