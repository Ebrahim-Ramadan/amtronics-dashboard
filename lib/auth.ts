import crypto from "crypto"
import type { SessionData, Role } from "./types"

const SESSION_COOKIE_NAME = "session"
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('Invalid/Missing environment variable: "SESSION_SECRET"')
  }
  return secret
}

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  return new Promise((resolve, reject) => {
    crypto.scrypt(plainTextPassword, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`)
    })
  })
}

export async function verifyPassword(plainTextPassword: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  return new Promise((resolve, reject) => {
    crypto.scrypt(plainTextPassword, salt, expected.length, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(crypto.timingSafeEqual(derivedKey, expected))
    })
  })
}

function base64url(input: Buffer | string): string {
  const buff = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buff.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function sign(data: string): string {
  const h = crypto.createHmac("sha256", getSessionSecret())
  h.update(data)
  return base64url(h.digest())
}

export function createSession(payload: Omit<SessionData, "iat" | "exp">, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000)
  const session: SessionData = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  }
  const body = base64url(Buffer.from(JSON.stringify(session)))
  const sig = sign(body)
  return `${body}.${sig}`
}

export function parseSession(sessionCookieValue: string | undefined): SessionData | null {
  if (!sessionCookieValue) return null
  const parts = sessionCookieValue.split(".")
  if (parts.length !== 2) return null
  const [body, sig] = parts
  if (sign(body) !== sig) return null
  try {
    const json = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()) as SessionData
    if (json.exp && json.exp < Math.floor(Date.now() / 1000)) return null
    return json
  } catch {
    return null
  }
}

export function setSessionCookie(response: Response, session: string, maxAgeSeconds = DEFAULT_TTL_SECONDS) {
  // NextResponse has cookies API; use headers for standard Response
  // We'll set via set-cookie header compatible with NextResponse.append if available
  const cookie = `${SESSION_COOKIE_NAME}=${session}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax`
  response.headers.append("Set-Cookie", cookie)
}

export function clearSessionCookie(response: Response) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
}

export function getSessionFromRequestHeaders(headers: Headers): SessionData | null {
  const cookieHeader = headers.get("cookie") || headers.get("Cookie")
  if (!cookieHeader) return null
  const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
  const value = match?.split("=")[1]
  return parseSession(value)
}

export function buildSessionPayload(params: {
  email: string
  role: Role
  engineerName?: string
  allowedEngineers?: string[]
}): Omit<SessionData, "iat" | "exp"> {
  return {
    email: params.email,
    role: params.role,
    engineerName: params.engineerName,
    allowedEngineers: params.allowedEngineers,
  }
}

export { SESSION_COOKIE_NAME }


